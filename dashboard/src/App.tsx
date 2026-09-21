import { useEffect, useState } from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SummarySection } from "@/components/summary-section"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LatencyBarChart, SpeedupChart } from "@/components/charts"
import { QuestionStats } from "@/components/question-stats"
import { ResultsTable } from "@/components/results-table"
import type { BenchmarkReport } from "@/lib/report"

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {report ? (
          <>
            <SummarySection report={report} />

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
                    質問ごとの速度差（LLM / Jev）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SpeedupChart runs={report.runs} />
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

      <SiteFooter />
    </div>
  )
}
