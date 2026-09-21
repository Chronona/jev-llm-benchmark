import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  computeFieldAgreements,
  summarizeAnswer,
  type BenchmarkRun,
} from "@/lib/report"
import { cn } from "@/lib/utils"

export function ResultsTable({ runs }: { runs: BenchmarkRun[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">詳細結果</h2>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>質問ID</TableHead>
              <TableHead>イテレーション</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Jev レイテンシ</TableHead>
              <TableHead>LLM レイテンシ</TableHead>
              <TableHead>高速倍率</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Jev 生回答</TableHead>
              <TableHead>LLM 生回答</TableHead>
              <TableHead>一致</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run, i) => {
              const fields = computeFieldAgreements(
                run.jev.answer,
                run.llm.answer
              )
              const allMatch =
                fields.length > 0 && fields.every((f) => f.match)
              const speedup =
                run.llm.timing.totalMs / run.jev.timing.totalMs
              return (
                <TableRow key={`${run.questionId}-${run.iteration}-${i}`}>
                  <TableCell>{run.questionId}</TableCell>
                  <TableCell>{run.iteration}</TableCell>
                  <TableCell className="max-w-60">{run.state}</TableCell>
                  <TableCell>{run.jev.timing.totalMs.toFixed(1)} ms</TableCell>
                  <TableCell>{run.llm.timing.totalMs.toFixed(1)} ms</TableCell>
                  <TableCell>{speedup.toFixed(2)}x</TableCell>
                  <TableCell>
                    <code>{summarizeAnswer(run.expected)}</code>
                  </TableCell>
                  <TableCell>
                    <pre className="max-w-80 overflow-x-auto whitespace-pre-wrap break-all text-xs">
                      {JSON.stringify(run.jev.answer, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell>
                    <pre className="max-w-80 overflow-x-auto whitespace-pre-wrap break-all text-xs">
                      {JSON.stringify(run.llm.answer, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-bold",
                      allMatch ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {allMatch ? "一致" : "不一致"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
