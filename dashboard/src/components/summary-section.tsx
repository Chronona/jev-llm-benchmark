import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  agreementRate,
  computeFieldAgreements,
  speedupText,
  type BenchmarkReport,
} from "@/lib/report"
import { cn } from "@/lib/utils"

export function SummarySection({ report }: { report: BenchmarkReport }) {
  const rate = agreementRate(
    report.runs.flatMap((r) =>
      computeFieldAgreements(r.jev.answer, r.llm.answer)
    )
  )
  const cards = [
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
      label: "Jev 高速倍率",
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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
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
            生成日時: {new Date(report.meta.generatedAt).toLocaleString()} |
            Jevモデル: <code>{report.meta.jevModel}</code> |
            LLMモデル: <code>{report.meta.llmModel}</code> |
            イテレーション: {report.meta.iterations} |
            ウォームアップ: {report.meta.warmupRuns} |
            総実行数: {report.runs.length} ペア
          </CardContent>
        </Card>
      </div>
  )
}
