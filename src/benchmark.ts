import "dotenv/config";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { questions, buildQuestionsFromInput } from "./questions.js";
import { JevClient, LLMClient } from "./clients.js";
import type { BenchmarkReport, BenchmarkRun, BenchmarkQuestion } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliArgs = parseArgs();
const iterations = cliArgs.iterations ?? parseInt(process.env.ITERATIONS ?? "3", 10);
const warmupRuns = cliArgs.warmupRuns ?? parseInt(process.env.WARMUP_RUNS ?? "1", 10);
const jevModel = process.env.JEV_MODEL ?? "jev-latest";
const llmModel = process.env.LLM_MODEL ?? "gpt-4o-mini";
const llmBaseURL = process.env.LLM_BASE_URL;

const jevApiKey = process.env.TYPESAFE_API_KEY;
const llmApiKey = process.env.LLM_API_KEY;

if (process.argv.slice(2).some((a) => a === "--help" || a === "-h")) {
  console.log(`Usage: npm run bench [options]

Options:
  -i, --input <text>       Add a custom user input to benchmark
      --input=<text>
      --questions-file <path>  JSON file with custom inputs
                               (array of strings or {id,state} objects)
      --skip-defaults        Skip built-in default questions
  -h, --help               Show this help`);
  process.exit(0);
}

if (!jevApiKey) {
  console.error("Missing TYPESAFE_API_KEY environment variable.");
  process.exit(1);
}

if (!llmApiKey) {
  console.error("Missing LLM_API_KEY environment variable.");
  process.exit(1);
}

const jevClient = new JevClient(jevApiKey, jevModel);
const llmClient = new LLMClient(llmApiKey, llmModel, llmBaseURL);

function normalizeJevAnswer(answer: unknown): unknown {
  if (!answer || typeof answer !== "object") return answer;
  const a = answer as Record<string, unknown>;
  if (a.type === "choice") return a.choice;
  if (a.type === "noul") return a.noul;
  if (a.type === "score") return Math.round(a.score as number);
  return answer;
}

function toBooleanLike(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value >= 0.5;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
    const num = parseFloat(lower);
    if (!isNaN(num)) return num >= 0.5;
  }
  return null;
}

function valuesMatch(
  a: unknown,
  b: unknown,
  aIsNoul: boolean
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (aIsNoul) {
    const boolB = toBooleanLike(b);
    if (boolB !== null) return (a as number) >= 0.5 === boolB;
  }
  if (typeof a === "number" && typeof b === "number") {
    return Math.round(a) === Math.round(b);
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function computeExpectedMatches(
  expected: Record<string, unknown> | undefined,
  jevAnswer: unknown,
  llmAnswer: unknown
) {
  if (!expected) return [];
  const jevFields = (jevAnswer && typeof jevAnswer === "object"
    ? jevAnswer
    : {}) as Record<string, unknown>;
  const llmFields = (llmAnswer && typeof llmAnswer === "object"
    ? llmAnswer
    : {}) as Record<string, unknown>;
  const matches = [];

  for (const [field, expectedVal] of Object.entries(expected)) {
    const jevRaw = jevFields[field];
    const llmRaw = llmFields[field];
    const jevActual = normalizeJevAnswer(jevRaw);
    const llmActual = llmRaw;
    const jevIsNoul: boolean = !!(
      jevRaw &&
      typeof jevRaw === "object" &&
      (jevRaw as Record<string, unknown>).type === "noul"
    );

    matches.push({
      field,
      expected: expectedVal,
      jevActual,
      llmActual,
      jevCorrect: valuesMatch(jevActual, expectedVal, jevIsNoul),
      llmCorrect: valuesMatch(llmActual, expectedVal, jevIsNoul),
    });
  }

  return matches;
}

interface CliArgs {
  customInputs: string[];
  questionsFile?: string;
  skipDefaults: boolean;
  iterations?: number;
  warmupRuns?: number;
  output?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const customInputs: string[] = [];
  let questionsFile: string | undefined;
  let skipDefaults = false;
  let iterations: number | undefined;
  let warmupRuns: number | undefined;
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if ((arg === "--input" || arg === "-i") && next) {
      customInputs.push(next);
      i++;
    } else if (arg.startsWith("--input=")) {
      customInputs.push(arg.slice("--input=".length));
    } else if (arg === "--questions-file" && next) {
      questionsFile = next;
      i++;
    } else if (arg === "--skip-defaults") {
      skipDefaults = true;
    } else if ((arg === "--iterations" || arg === "-n") && next) {
      iterations = parseInt(next, 10);
      i++;
    } else if (arg === "--warmup" && next) {
      warmupRuns = parseInt(next, 10);
      i++;
    } else if (arg === "--output" && next) {
      output = next;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run bench [options]

Options:
  -i, --input <text>       Add a custom user input to benchmark
      --input=<text>
      --questions-file <path>  JSON file with custom inputs
                               (array of strings or {id,state} objects)
      --skip-defaults        Skip built-in default questions
  -n, --iterations <num>   Number of iterations (default: env ITERATIONS or 3)
      --warmup <num>         Number of warmup runs (default: env WARMUP_RUNS or 1)
      --output <path>        Output path for results.json
  -h, --help               Show this help`);
      process.exit(0);
    }
  }

  return { customInputs, questionsFile, skipDefaults, iterations, warmupRuns, output };
}

function loadQuestionsFromFile(path: string): BenchmarkQuestion[] {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("Questions file must contain a JSON array");
  }

  return raw.map((entry: unknown, index: number) => {
    if (typeof entry === "string") {
      return buildQuestionsFromInput(entry);
    }
    if (entry && typeof entry === "object" && "state" in entry) {
      const e = entry as { id?: string; state: string };
      return {
        ...buildQuestionsFromInput(e.state),
        id: e.id ?? `file-${index + 1}`,
      };
    }
    throw new Error(
      `Invalid entry at index ${index}: ${JSON.stringify(entry)}`
    );
  });
}

function buildQuestionList(): BenchmarkQuestion[] {
  const { customInputs, questionsFile, skipDefaults } = parseArgs();
  const list: BenchmarkQuestion[] = [];

  if (questionsFile) {
    list.push(...loadQuestionsFromFile(questionsFile));
  }

  for (const input of customInputs) {
    list.unshift(buildQuestionsFromInput(input));
  }

  if (!skipDefaults) {
    list.push(...questions);
  }

  return list;
}

let benchmarkQuestions: BenchmarkQuestion[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function warmup(): Promise<void> {
  console.log(`Warming up with ${warmupRuns} run(s)...`);
  for (let i = 0; i < warmupRuns; i++) {
    const q = benchmarkQuestions[0];
    if (!q) continue;
    try {
      await jevClient.ask(q);
      await llmClient.ask(q);
      await sleep(500);
    } catch (err) {
      console.warn(`Warmup run ${i + 1} failed:`, err);
    }
  }
}

async function runBenchmark(): Promise<BenchmarkReport> {
  const runs: BenchmarkRun[] = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\nIteration ${i + 1}/${iterations}`);
    for (const q of benchmarkQuestions) {
      process.stdout.write(`  ${q.id} ... `);

      const jevResult = await jevClient.ask(q);
      const llmResult = await llmClient.ask(q);

      const expectedMatches = computeExpectedMatches(
        q.expected,
        jevResult.answer,
        llmResult.answer
      );

      runs.push({
        questionId: q.id,
        iteration: i + 1,
        state: q.state,
        expected: q.expected,
        jev: jevResult,
        llm: llmResult,
        expectedMatches,
      });

      process.stdout.write(
        `Jev=${jevResult.timing.totalMs.toFixed(1)}ms LLM=${llmResult.timing.totalMs.toFixed(1)}ms\n`
      );

      await sleep(300);
    }
  }

  const jevAvgMs =
    runs.reduce((sum, r) => sum + r.jev.timing.totalMs, 0) / runs.length;
  const llmAvgMs =
    runs.reduce((sum, r) => sum + r.llm.timing.totalMs, 0) / runs.length;
  const speedupRatio = llmAvgMs / jevAvgMs;

  const jevTotalTokens = runs.reduce(
    (sum, r) => sum + r.jev.usage.input_tokens + r.jev.usage.output_tokens,
    0
  );
  const llmTotalTokens = runs.reduce(
    (sum, r) => sum + r.llm.usage.input_tokens + r.llm.usage.output_tokens,
    0
  );

  const allMatches = runs.flatMap((r) => r.expectedMatches);
  const jevCorrect = allMatches.filter((m) => m.jevCorrect).length;
  const llmCorrect = allMatches.filter((m) => m.llmCorrect).length;
  const jevAccuracy = allMatches.length ? (jevCorrect / allMatches.length) * 100 : 0;
  const llmAccuracy = allMatches.length ? (llmCorrect / allMatches.length) * 100 : 0;

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      iterations,
      warmupRuns,
      jevModel,
      llmModel,
    },
    runs,
    summary: {
      jevAvgMs,
      llmAvgMs,
      speedupRatio,
      jevTotalTokens,
      llmTotalTokens,
      jevAccuracy,
      llmAccuracy,
    },
  };
}

async function main(): Promise<void> {
  benchmarkQuestions = buildQuestionList();

  console.log("Jev vs LLM Latency Benchmark");
  console.log("============================");
  console.log(`Jev model:    ${jevModel}`);
  console.log(`LLM model:    ${llmModel}`);
  console.log(`LLM base URL: ${llmBaseURL ?? "OpenAI default"}`);
  console.log(`Questions:    ${benchmarkQuestions.length}`);
  console.log(`Iterations:   ${iterations}`);
  console.log(`Warmup:       ${warmupRuns}`);

  await warmup();
  const report = await runBenchmark();

  const outputPath = cliArgs.output ?? join(__dirname, "..", "data", "results.json");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log("\n============================");
  console.log("Summary");
  console.log("============================");
  console.log(`Jev avg latency:  ${report.summary.jevAvgMs.toFixed(1)} ms`);
  console.log(`LLM avg latency:  ${report.summary.llmAvgMs.toFixed(1)} ms`);
  console.log(`Speedup ratio:    ${report.summary.speedupRatio.toFixed(2)}x`);
  console.log(`Jev total tokens: ${report.summary.jevTotalTokens}`);
  console.log(`LLM total tokens: ${report.summary.llmTotalTokens}`);
  console.log(`Jev accuracy:     ${report.summary.jevAccuracy.toFixed(1)}%`);
  console.log(`LLM accuracy:     ${report.summary.llmAccuracy.toFixed(1)}%`);
  console.log(`\nResults written to: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
  // 未処理の非同期リソースが残っている場合に備え、短時間待ってから強制終了
  setTimeout(() => process.exit(1), 1500);
});
