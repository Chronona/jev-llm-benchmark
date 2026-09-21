import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ExpectedMatch } from "@/lib/report"

export const jevBadgeClass = "border-transparent bg-cyan-400/15 text-cyan-300"
export const llmBadgeClass = "border-transparent bg-pink-400/15 text-pink-300"

export function AccuracyBadges({
  matches,
  model,
}: {
  matches: ExpectedMatch[] | undefined
  model: "jev" | "llm"
}) {
  if (!matches?.length) return null
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1">
      {matches.map((m) => {
        const correct = model === "jev" ? m.jevCorrect : m.llmCorrect
        return (
          <Badge
            key={m.field}
            title={`expected ${m.field}=${String(m.expected)}`}
            className={cn(
              correct
                ? "border-transparent bg-green-400/15 text-green-400"
                : "border-transparent bg-red-400/15 text-red-400"
            )}
          >
            {correct ? "✓" : "✗"}
          </Badge>
        )
      })}
    </span>
  )
}
