// Generate a sample results.json for demo / GitHub Pages.
// This file is NOT a real benchmark result; it is only for UI preview.

const questions = [
  {
    id: "sentiment",
    state: "I absolutely love the new dashboard, it is so fast and intuitive!",
    expected: { sentiment: "positive" },
    jevAnswer: { sentiment: { type: "choice", choice: "positive", confidence: 0.98 } },
    llmAnswer: { sentiment: "positive" },
  },
  {
    id: "category",
    state: "I was charged twice this month. Please refund the duplicate payment.",
    expected: { category: "billing" },
    jevAnswer: { category: { type: "choice", choice: "billing", confidence: 0.95 } },
    llmAnswer: { category: "billing" },
  },
  {
    id: "urgency",
    state: "The production database is down and customers cannot complete checkout.",
    expected: { urgency: 2 },
    jevAnswer: { urgency: { type: "score", score: 2.0, confidence: 0.97 } },
    llmAnswer: { urgency: 2 },
  },
  {
    id: "priority",
    state: "My monthly report export is taking longer than usual.",
    expected: { priority: "medium" },
    jevAnswer: { priority: { type: "choice", choice: "medium", confidence: 0.82 } },
    llmAnswer: { priority: "high" },
  },
];

function makeRun(q, iteration) {
  const jevMs = 40 + Math.random() * 60;
  const llmMs = 300 + Math.random() * 400;

  const expectedMatches = Object.entries(q.expected ?? {}).map(([field, expected]) => {
    const jevActual = normalizeJev(q.jevAnswer[field]);
    const llmActual = q.llmAnswer[field];
    return {
      field,
      expected,
      jevActual,
      llmActual,
      jevCorrect: valuesMatch(jevActual, expected),
      llmCorrect: valuesMatch(llmActual, expected),
    };
  });

  return {
    questionId: q.id,
    iteration,
    state: q.state,
    expected: q.expected,
    jev: {
      model: "jev-1.13.0",
      timing: { startMs: 0, endMs: jevMs, totalMs: jevMs },
      usage: { input_tokens: 60 + Math.floor(Math.random() * 40), output_tokens: 20 },
      answer: q.jevAnswer,
    },
    llm: {
      model: "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF",
      timing: { startMs: 0, endMs: llmMs, totalMs: llmMs },
      usage: { input_tokens: 100 + Math.floor(Math.random() * 50), output_tokens: 30 },
      answer: q.llmAnswer,
    },
    expectedMatches,
  };
}

function normalizeJev(field) {
  if (!field || typeof field !== "object") return field;
  if (field.type === "choice") return field.choice;
  if (field.type === "noul") return field.noul;
  if (field.type === "score") return Math.round(field.score);
  return field;
}

function valuesMatch(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === "number" && typeof b === "number") return Math.round(a) === Math.round(b);
  return String(a).toLowerCase() === String(b).toLowerCase();
}

const runs = [];
for (let i = 1; i <= 3; i++) {
  for (const q of questions) {
    runs.push(makeRun(q, i));
  }
}

const jevTimes = runs.map((r) => r.jev.timing.totalMs);
const llmTimes = runs.map((r) => r.llm.timing.totalMs);
const jevAvgMs = jevTimes.reduce((a, b) => a + b, 0) / jevTimes.length;
const llmAvgMs = llmTimes.reduce((a, b) => a + b, 0) / llmTimes.length;
const allMatches = runs.flatMap((r) => r.expectedMatches);
const jevCorrect = allMatches.filter((m) => m.jevCorrect).length;
const llmCorrect = allMatches.filter((m) => m.llmCorrect).length;

const report = {
  meta: {
    generatedAt: new Date().toISOString(),
    iterations: 3,
    warmupRuns: 1,
    jevModel: "jev-latest",
    llmModel: "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF",
  },
  runs,
  summary: {
    jevAvgMs,
    llmAvgMs,
    speedupRatio: llmAvgMs / jevAvgMs,
    jevTotalTokens: runs.reduce((sum, r) => sum + r.jev.usage.input_tokens + r.jev.usage.output_tokens, 0),
    llmTotalTokens: runs.reduce((sum, r) => sum + r.llm.usage.input_tokens + r.llm.usage.output_tokens, 0),
    jevAccuracy: (jevCorrect / allMatches.length) * 100,
    llmAccuracy: (llmCorrect / allMatches.length) * 100,
  },
};

console.log(JSON.stringify(report, null, 2));
