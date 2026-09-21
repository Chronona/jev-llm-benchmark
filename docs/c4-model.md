# C4 設計モデル

Jev vs LLM Benchmark のアーキテクチャを C4 モデル（Context / Container / Component / Code）で記述します。

## C1 - System Context

```mermaid
flowchart TB
    User([Engineer / Evaluator])
    Bench[System Under Test<br/>Jev vs LLM Benchmark]
    TypeSafe[TypeSafe AI API]
    OpenAI[OpenAI API]
    LMStudio[LM Studio]
    Dashboard[Benchmark Dashboard]

    User -->|runs benchmark| Bench
    User -->|views results| Dashboard
    Bench -->|HTTP POST /v1/systemone| TypeSafe
    Bench -->|HTTP POST /v1/chat/completions| OpenAI
    Bench -.->|or local LM Studio| LMStudio
    Bench -->|writes results.json| Dashboard
```

## C2 - Container

```mermaid
flowchart TB
    subgraph "Local Machine"
        Runner[Node.js Benchmark Runner<br/>TypeScript + tsx]
        HTML[Static HTML Dashboard<br/>Chart.js + Mermaid]
        Env[.env configuration]
    end

    subgraph "External Services"
        TS[TypeSafe AI API<br/>model: jev-latest]
        OAI[OpenAI API<br/>or OpenAI-compatible proxy]
        LMStudio[LM Studio<br/>localhost:1234/v1]
    end

    Env -->|TYPESAFE_API_KEY| Runner
    Env -->|LLM_API_KEY| Runner
    Env -->|LLM_BASE_URL| Runner
    Runner -->|1. call Jev| TS
    Runner -->|2. call LLM| OAI
    Runner -.->|2-alt. call local LLM| LMStudio
    Runner -->|3. write results.json| HTML
```

| コンテナ | 責務 | 技術 |
| --- | --- | --- |
| Benchmark Runner | 質問セットを読み込み、両APIを呼び出し、レイテンシとusageを計測・保存 | Node.js 20+, TypeScript, tsx |
| Static HTML Dashboard | results.json を読み込み、表・グラフを表示 | Vanilla HTML + Chart.js |
| .env configuration | APIキーなどの機密情報を分離管理 | dotenv |
| TypeSafe AI API | System One モデル Jev が構造化回答を返す | HTTPS JSON API |
| OpenAI API | 生成LLMがテキスト/JSON回答を返す | HTTPS JSON API |
| LM Studio | ローカルで動作するOpenAI互換API（任意） | HTTP JSON API on localhost |

## C3 - Component

```mermaid
flowchart LR
    subgraph "Benchmark Runner"
        CLI[CLI / Main]
        QS[QuestionSet<br/>質問セット定義]
        JC[JevClient<br/>TypeSafe SDK]
        LC[LLMClient<br/>OpenAI SDK]
        TM[Timer<br/>latency measurement]
        RS[ResultStore<br/>JSON serializer]
        RP[Reporter<br/>console summary]
    end

    CLI -->|load| QS
    CLI -->|measure| TM
    CLI -->|invoke| JC
    CLI -->|invoke| LC
    JC -->|raw answer| TM
    LC -->|raw answer| TM
    TM -->|record| RS
    RS -->|write| RP
```

ソース対応：`src/benchmark.ts`（CLI / Timer / ResultStore / Reporter）、`src/questions.ts`（QuestionSet）、`src/clients.ts`（JevClient / LLMClient）、`src/types.ts`（型定義）。

## C4 - Code

```mermaid
classDiagram
    class BenchmarkConfig {
        +iterations: number
        +warmupRuns: number
        +jevModel: string
        +llmModel: string
    }

    class Question {
        +id: string
        +state: string
        +jevQuestions: Record~string, Question~
        +llmPrompt: string
        +expected: object
    }

    class Timing {
        +startMs: number
        +endMs: number
        +totalMs: number
    }

    class BenchmarkResult {
        +questionId: string
        +iteration: number
        +jev: ProviderResult
        +llm: ProviderResult
    }

    class ProviderResult {
        +model: string
        +timing: Timing
        +usage: Usage
        +answer: object
    }

    class Usage {
        +inputTokens: number
        +outputTokens: number
    }

    BenchmarkConfig <-- BenchmarkResult
    Question <-- BenchmarkResult
    Timing <-- ProviderResult
    Usage <-- ProviderResult
    ProviderResult <-- BenchmarkResult
```

型の正本は `src/types.ts` を参照してください。
