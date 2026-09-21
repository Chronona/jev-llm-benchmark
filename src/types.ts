import type { Question } from "@typesafe-ai/sdk";

export interface BenchmarkQuestion {
  id: string;
  state: string;
  jevQuestions: Record<string, Question>;
  llmPrompt: string;
  expected?: Record<string, unknown>;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface Timing {
  startMs: number;
  endMs: number;
  totalMs: number;
}

export interface ProviderResult {
  model: string;
  timing: Timing;
  usage: Usage;
  answer: unknown;
}

export interface ExpectedMatch {
  field: string;
  expected: unknown;
  jevActual: unknown;
  llmActual: unknown;
  jevCorrect: boolean;
  llmCorrect: boolean;
}

export interface BenchmarkRun {
  questionId: string;
  iteration: number;
  state: string;
  expected?: Record<string, unknown>;
  jev: ProviderResult;
  llm: ProviderResult;
  expectedMatches: ExpectedMatch[];
}

export interface BenchmarkReport {
  meta: {
    generatedAt: string;
    iterations: number;
    warmupRuns: number;
    jevModel: string;
    llmModel: string;
  };
  runs: BenchmarkRun[];
  summary: {
    jevAvgMs: number;
    llmAvgMs: number;
    speedupRatio: number;
    jevTotalTokens: number;
    llmTotalTokens: number;
    jevAccuracy: number;
    llmAccuracy: number;
  };
}
