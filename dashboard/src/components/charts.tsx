import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"

import {
  avg,
  groupRunsByQuestion,
  type BenchmarkRun,
} from "@/lib/report"

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const JEV_COLOR = "#22d3ee"
const LLM_COLOR = "#f472b6"
const SPEEDUP_COLOR = "#a78bfa"
const TEXT_COLOR = "#e2e8f0"
const MUTED_COLOR = "#94a3b8"
const GRID_COLOR = "#334155"

const baseOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: TEXT_COLOR } } },
}

function axisWithUnit(unit: string) {
  return {
    title: { display: true, text: unit, color: MUTED_COLOR },
    grid: { color: GRID_COLOR },
    ticks: { color: MUTED_COLOR },
  }
}

// 質問ごとの平均レイテンシ（Jev vs LLM）
export function LatencyBarChart({ runs }: { runs: BenchmarkRun[] }) {
  const groups = groupRunsByQuestion(runs)
  return (
    <div className="relative h-72">
      <Bar
        options={{
          ...baseOptions,
          scales: {
            y: axisWithUnit("ms"),
            x: {
              grid: { color: GRID_COLOR },
              ticks: { color: MUTED_COLOR },
            },
          },
        }}
        data={{
          labels: groups.map((g) => g.id),
          datasets: [
            {
              label: "Jev",
              data: groups.map((g) =>
                avg(g.runs.map((r) => r.jev.timing.totalMs))
              ),
              backgroundColor: JEV_COLOR,
            },
            {
              label: "LLM",
              data: groups.map((g) =>
                avg(g.runs.map((r) => r.llm.timing.totalMs))
              ),
              backgroundColor: LLM_COLOR,
            },
          ],
        }}
      />
    </div>
  )
}

// 質問ごとの高速倍率（LLM平均 / Jev平均 = Jev が何倍高速か）
export function SpeedupChart({ runs }: { runs: BenchmarkRun[] }) {
  const groups = groupRunsByQuestion(runs)
  return (
    <div className="relative h-72">
      <Bar
        options={{
          ...baseOptions,
          plugins: { legend: { display: false } },
          scales: {
            y: axisWithUnit("倍率 (x)"),
            x: {
              grid: { color: GRID_COLOR },
              ticks: { color: MUTED_COLOR },
            },
          },
        }}
        data={{
          labels: groups.map((g) => g.id),
          datasets: [
            {
              label: "高速倍率 (x)",
              data: groups.map(
                (g) =>
                  avg(g.runs.map((r) => r.llm.timing.totalMs)) /
                  avg(g.runs.map((r) => r.jev.timing.totalMs))
              ),
              backgroundColor: SPEEDUP_COLOR,
            },
          ],
        }}
      />
    </div>
  )
}
