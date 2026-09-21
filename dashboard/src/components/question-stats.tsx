import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AccuracyBadges, llmBadgeClass, jevBadgeClass } from "@/components/accuracy-badges"
import {
  agreementRate,
  avg,
  computeFieldAgreements,
  formatMeanStd,
  groupRunsByQuestion,
  summarizeAnswer,
  type BenchmarkRun,
} from "@/lib/report"
import { cn } from "@/lib/utils"

export function QuestionStats({ runs }: { runs: BenchmarkRun[] }) {
  const groups = groupRunsByQuestion(runs)
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">質問ごとの統計</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const jevTimes = group.runs.map((r) => r.jev.timing.totalMs)
          const llmTimes = group.runs.map((r) => r.llm.timing.totalMs)
          const speedup = avg(llmTimes) / avg(jevTimes)
          const rate = agreementRate(
            group.runs.flatMap((r) =>
              computeFieldAgreements(r.jev.answer, r.llm.answer)
            )
          )
          const last = group.runs[group.runs.length - 1]
          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.id}</CardTitle>
                <CardDescription>{group.state}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <Badge className={jevBadgeClass}>Jev</Badge>{" "}
                  {formatMeanStd(jevTimes)}
                </div>
                <div>
                  <Badge className={llmBadgeClass}>LLM</Badge>{" "}
                  {formatMeanStd(llmTimes)}
                </div>
                <div className="text-muted-foreground">
                  速度差: {speedup.toFixed(2)}x
                </div>
                <div
                  className={cn(
                    "font-semibold",
                    rate >= 100 ? "text-green-400" : "text-red-400"
                  )}
                >
                  一致率: {rate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Expected: <code>{summarizeAnswer(last.expected)}</code>
                </div>
                <div className="text-xs">
                  <Badge className={jevBadgeClass}>Jev</Badge>{" "}
                  <code>{summarizeAnswer(last.jev.answer)}</code>
                  <AccuracyBadges
                    matches={last.expectedMatches}
                    model="jev"
                  />
                </div>
                <div className="text-xs">
                  <Badge className={llmBadgeClass}>LLM</Badge>{" "}
                  <code>{summarizeAnswer(last.llm.answer)}</code>
                  <AccuracyBadges
                    matches={last.expectedMatches}
                    model="llm"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
