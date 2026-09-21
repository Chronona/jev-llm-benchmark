// data/results.json の型と、旧 public/index.html から移植した集計ロジック。

export interface Timing {
  startMs: number
  endMs: number
  totalMs: number
}

export interface Usage {
  input_tokens: number
  output_tokens: number
}

export interface ProviderResult {
  model: string
  timing: Timing
  usage: Usage
  answer: unknown
}

export interface ExpectedMatch {
  field: string
  expected: unknown
  jevActual: unknown
  llmActual: unknown
  jevCorrect: boolean
  llmCorrect: boolean
}

export interface BenchmarkRun {
  questionId: string
  iteration: number
  state: string
  expected?: Record<string, unknown>
  jev: ProviderResult
  llm: ProviderResult
  expectedMatches: ExpectedMatch[]
}

export interface BenchmarkReport {
  meta: {
    generatedAt: string
    iterations: number
    warmupRuns: number
    jevModel: string
    llmModel: string
  }
  runs: BenchmarkRun[]
  summary: {
    jevAvgMs: number
    llmAvgMs: number
    speedupRatio: number
    jevTotalTokens: number
    llmTotalTokens: number
    jevAccuracy?: number
    llmAccuracy?: number
  }
}

export interface FieldAgreement {
  key: string
  jevVal: unknown
  llmVal: unknown
  match: boolean
}

export function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function std(values: number[]): number {
  const mean = avg(values)
  return Math.sqrt(avg(values.map((v) => (v - mean) ** 2)))
}

export function formatMeanStd(values: number[]): string {
  return `${avg(values).toFixed(1)} ± ${std(values).toFixed(1)} ms`
}

export function speedupText(ratio: number): string {
  return ratio >= 1
    ? `${ratio.toFixed(2)}x 遅い`
    : `${(1 / ratio).toFixed(2)}x 速い`
}

type JevFieldType = "choice" | "noul" | "score" | "raw"

function getJevValueAndType(jevField: unknown): {
  value: unknown
  type: JevFieldType
} {
  if (!jevField || typeof jevField !== "object")
    return { value: jevField, type: "raw" }
  const f = jevField as Record<string, unknown>
  if (f.type === "choice") return { value: f.choice, type: "choice" }
  if (f.type === "noul") return { value: f.noul, type: "noul" }
  if (f.type === "score")
    return { value: Math.round(f.score as number), type: "score" }
  return { value: jevField, type: "raw" }
}

export function normalizeJevAnswer(jevField: unknown): unknown {
  return getJevValueAndType(jevField).value
}

function toBooleanLike(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value >= 0.5
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    if (lower === "true") return true
    if (lower === "false") return false
    const num = parseFloat(lower)
    if (!isNaN(num)) return num >= 0.5
  }
  return null
}

function valuesMatch(a: unknown, b: unknown, aType: JevFieldType): boolean {
  if (a === null || a === undefined || b === null || b === undefined)
    return false

  // Noul（確率） vs boolean / 文字列真偽値：0.5 を閾値に boolean 化して比較
  if (aType === "noul") {
    const boolB = toBooleanLike(b)
    if (boolB !== null) return (a as number) >= 0.5 === boolB
  }

  if (typeof a === "number" && typeof b === "number") {
    return Math.round(a) === Math.round(b)
  }
  return String(a).toLowerCase() === String(b).toLowerCase()
}

export function computeFieldAgreements(
  jevAnswer: unknown,
  llmAnswer: unknown
): FieldAgreement[] {
  const fields: FieldAgreement[] = []
  const jevObj = (jevAnswer ?? {}) as Record<string, unknown>
  const llmObj = (llmAnswer ?? {}) as Record<string, unknown>
  for (const [key, jevField] of Object.entries(jevObj)) {
    const { value: jevVal, type: jevType } = getJevValueAndType(jevField)
    const llmVal = llmObj[key]
    fields.push({ key, jevVal, llmVal, match: valuesMatch(jevVal, llmVal, jevType) })
  }
  return fields
}

export function summarizeAnswer(answer: unknown): string {
  return Object.entries((answer ?? {}) as Record<string, unknown>)
    .map(([key, val]) => `${key}=${String(normalizeJevAnswer(val))}`)
    .join(", ")
}

export function agreementRate(fields: FieldAgreement[]): number {
  if (!fields.length) return 0
  return (fields.filter((f) => f.match).length / fields.length) * 100
}

export interface QuestionGroup {
  id: string
  state: string
  runs: BenchmarkRun[]
}

export function groupRunsByQuestion(runs: BenchmarkRun[]): QuestionGroup[] {
  const map = new Map<string, QuestionGroup>()
  for (const run of runs) {
    const group = map.get(run.questionId)
    if (group) {
      group.runs.push(run)
    } else {
      map.set(run.questionId, {
        id: run.questionId,
        state: run.state,
        runs: [run],
      })
    }
  }
  return [...map.values()]
}
