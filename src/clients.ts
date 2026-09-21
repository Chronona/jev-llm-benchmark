import { TypeSafeClient } from "@typesafe-ai/sdk";
import OpenAI from "openai";
import type { BenchmarkQuestion, ProviderResult } from "./types.js";

function extractJson(text: string): unknown {
  let trimmed = text.trim();

  // 0. 思考プロセスタグ（<think>, <antThinking> など）を除去
  trimmed = trimmed
    .replace(/<antThinking>[\s\S]*?<\/antThinking>/gi, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .trim();

  // 1. 全体が JSON の場合
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Markdown コードブロックから抽出
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch {
      // continue
    }
  }

  // 3. 最初の {...} または [...] ブロックを非貪欲で抽出
  const block = trimmed.match(/(\{[\s\S]*?\}|\[[\s\S]*?\])/);
  if (block?.[1]) {
    try {
      return JSON.parse(block[1].trim());
    } catch {
      // continue
    }
  }

  console.error("Raw LLM response:\n", text);
  throw new Error(
    `Could not extract JSON from LLM response (see raw output above)`
  );
}

export class JevClient {
  private client: TypeSafeClient;

  constructor(apiKey: string, private model: string) {
    this.client = new TypeSafeClient({
      apiKey,
      retry: { maxRetries: 0 },
    });
  }

  async ask(q: BenchmarkQuestion): Promise<ProviderResult> {
    const start = performance.now();
    const response = await this.client.systemOne({
      model: this.model,
      state: q.state,
      questions: q.jevQuestions,
    });
    const end = performance.now();

    return {
      model: response.model ?? this.model,
      timing: {
        startMs: start,
        endMs: end,
        totalMs: end - start,
      },
      usage: response.usage,
      answer: response.answers,
    };
  }
}

export class LLMClient {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private model: string,
    baseURL?: string
  ) {
    this.client = new OpenAI({ apiKey, baseURL, maxRetries: 0 });
  }

  async ask(q: BenchmarkQuestion): Promise<ProviderResult> {
    const start = performance.now();
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            'You are a classifier. Answer only with a single valid JSON object matching the requested schema. Do not wrap in markdown code blocks. Do not output any thinking process or reasoning. No explanation, no commentary.\n\nExample output format:\n{"sentiment": "positive", "category": "billing", "urgency": 2}',
        },
        { role: "user", content: q.llmPrompt },
      ],
      temperature: 0,
    });
    const end = performance.now();

    const content = completion.choices[0]?.message?.content ?? "{}";
    const answer = extractJson(content);

    return {
      model: completion.model,
      timing: {
        startMs: start,
        endMs: end,
        totalMs: end - start,
      },
      usage: {
        input_tokens: completion.usage?.prompt_tokens ?? 0,
        output_tokens: completion.usage?.completion_tokens ?? 0,
      },
      answer,
    };
  }
}
