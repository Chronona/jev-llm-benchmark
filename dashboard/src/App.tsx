import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AgreementChart,
  LatencyBarChart,
  LatencyScatterChart,
} from "@/components/charts"
import { QuestionStats } from "@/components/question-stats"
import { ResultsTable } from "@/components/results-table"
import {
  agreementRate,
  computeFieldAgreements,
  speedupText,
  type BenchmarkReport,
} from "@/lib/report"
import { cn } from "@/lib/utils"

const REPO_URL = "https://github.com/Chronona/jev-llm-benchmark"

function GithubMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.27 1.29.07.05.12.28.34.22.77-.2 1.57-.59 2.43-.59 1.46 0 2.68.45 3.44 1.29.43-.09 1-.35 1.3-.51-.1-1.09-.52-2.22-1.37-3.04-.34-.19-.68-.46-.68-1.14 0-.5.26-.9.62-1.14-.07-.1-.56-1.72.12-2.62.14-.2.66-1.04-.24-2.2-.9-.24-2.04-.54-4 0-.54.9-.24 2.06-.05 2.42.34.32.7.82.62 1.14.34.68.34 1.78 0 1.14-.34.95-.68 1.14-.62.24-.55 1.15-.62 2.24-.38 1.21-.82 2.16-1.64 2.82-.2.2-.36.87-.24 1.08.2.31.55.31.88.31 1.28 0 2.6-.73 3.24-1.98.22-.44.2-.92-.02-1.36z" />
    </svg>
  )
}

export default function App() {
  const [report, setReport] = useState<BenchmarkReport | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/results.json`)
      .then((res) => {
        if (!res.ok) throw new Error("results.json not found")
        return res.json() as Promise<BenchmarkReport>
      })
      .then(setReport)
      .catch((err: unknown) => {
        console.warn("Could not load results:", err)
      })
  }, [])

  const rate = report
    ? agreementRate(
        report.runs.flatMap((r) =>
          computeFieldAgreements(r.jev.answer, r.llm.answer)
        )
      )
    : 0

  const summaryCards = report
    ? [
        {
          label: "Jev 平均レイテンシ",
          value: `${report.summary.jevAvgMs.toFixed(1)} ms`,
          accent: "text-cyan-300",
        },
        {
          label: "LLM 平均レイテンシ",
          value: `${report.summary.llmAvgMs.toFixed(1)} ms`,
          accent: "text-pink-300",
        },
        {
          label: "速度差（LLM / Jev）",
          value: speedupText(report.summary.speedupRatio),
          accent: "",
        },
        {
          label: "総トークン（Jev / LLM）",
          value: `${report.summary.jevTotalTokens} / ${report.summary.llmTotalTokens}`,
          accent: "",
        },
        {
          label: "回答一致率",
          value: `${rate.toFixed(1)}%`,
          accent: rate >= 100 ? "text-green-400" : "text-red-400",
        },
        {
          label: "Jev 期待値一致率",
          value:
            report.summary.jevAccuracy !== undefined
              ? `${report.summary.jevAccuracy.toFixed(1)}%`
              : "-",
          accent: "text-cyan-300",
        },
        {
          label: "LLM 期待値一致率",
          value:
            report.summary.llmAccuracy !== undefined
              ? `${report.summary.llmAccuracy.toFixed(1)}%`
              : "-",
          accent: "text-pink-300",
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Jev vs LLM レイテンシ比較ダッシュボード
            </h1>
            <p className="text-sm text-muted-foreground">
              TypeSafe Jev（System One）とOpenAI互換LLM（ローカルLLM含む）の回答速度を比較
            </p>
          </div>
          <Button asChild variant="outline" size="icon" aria-label="GitHubリポジトリ">
            <a href={REPO_URL} target="_blank" rel="noopener">
              <GithubMark />
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {report ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {summaryCards.map((c) => (
                <Card key={c.label}>
                  <CardHeader>
                    <CardDescription>{c.label}</CardDescription>
                    <CardTitle className={cn("text-2xl", c.accent)}>
                      {c.value}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
              <Card>
                <CardHeader>
                  <CardDescription>実行条件</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  生成日時:{" "}
                  {new Date(report.meta.generatedAt).toLocaleString()} |
                  Jevモデル: <code>{report.meta.jevModel}</code> |
                  LLMモデル: <code>{report.meta.llmModel}</code> |
                  イテレーション: {report.meta.iterations} |
                  ウォームアップ: {report.meta.warmupRuns} |
                  総実行数: {report.runs.length} ペア
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    質問ごとの平均レイテンシ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LatencyBarChart runs={report.runs} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    イテレーションごとのレイテンシ分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LatencyScatterChart runs={report.runs} />
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    質問ごとの回答一致率
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AgreementChart runs={report.runs} />
                </CardContent>
              </Card>
            </div>

            <QuestionStats runs={report.runs} />
            <ResultsTable runs={report.runs} />
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>
                <code>data/results.json</code> が見つかりません。
              </p>
              <p>
                ベンチマークを実行すると結果が表示されます:{" "}
                <code>npm run bench</code>
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026{" "}
        <a
          href="https://github.com/Chronona"
          target="_blank"
          rel="noopener"
          className="text-cyan-300 hover:underline"
        >
          chronona
        </a>{" "}
        ·{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener"
          className="text-cyan-300 hover:underline"
        >
          GitHubリポジトリ
        </a>{" "}
        · MIT License
      </footer>
    </div>
  )
}
