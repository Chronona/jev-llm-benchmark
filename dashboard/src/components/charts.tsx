import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { Bar, Scatter } from "react-chartjs-2"

import {
  agreementRate,
  avg,
  computeFieldAgreements,
  groupRunsByQuestion,
  type BenchmarkRun,
} from "@/lib/report"

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const JEV_COLOR = "#22d3ee"
const LLM_COLOR = "#f472b6"
const TEXT_COLOR = "#e2e8f0"
const MUTED_COLOR = "#94a3b8"
const GRID_COLOR = "#334155"
const MATCH_COLOR = "#4ade80"
const MISMATCH_COLOR = "#f87171"

const legendLabels = {
  color: TEXT_COLOR,
} as const

function axisWithUnit(unit: string) {
  return {
    title: { display: true, text: unit, color: MUTED_COLOR },
    grid: { color: GRID_COLOR },
    ticks: { color: MUTED_COLOR },
  }
}

export function LatencyBarChart({ runs }: { runs: BenchmarkRun[] }) {
  const groups = groupRunsByQuestion(runs)
  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: { legend: { labels: legendLabels } },
    scales: {
      y: axisWithUnit("ms"),
      x: { grid: { color: GRID_COLOR }, ticks: { color: MUTED_COLOR } },
    },
  }
  return (
    <Bar
      options={options}
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
  )
}

export function LatencyScatterChart({ runs }: { runs: BenchmarkRun[] }) {
  const options: ChartOptions<"scatter"> = {
    responsive: true,
    plugins: { legend: { labels: legendLabels } },
    scales: {
      y: axisWithUnit("ms"),
      x: {
        ...axisWithUnit("Run index"),
      },
    },
  }
  return (
    <Scatter
      options={options}
      data={{
        datasets: [
          {
            label: "Jev",
            data: runs.map((r, i) => ({ x: i + 1, y: r.jev.timing.totalMs })),
            backgroundColor: JEV_COLOR,
          },
          {
            label: "LLM",
            data: runs.map((r, i) => ({ x: i + 1, y: r.llm.timing.totalMs })),
            backgroundColor: LLM_COLOR,
          },
        ],
      }}
    />
  )
}

export function AgreementChart({ runs }: { runs: BenchmarkRun[] }) {
  const groups = groupRunsByQuestion(runs)
  const data = groups.map((g) =>
    agreementRate(
      g.runs.flatMap((r) => computeFieldAgreements(r.jev.answer, r.llm.answer))
    )
  )
  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100, ...axisWithUnit("%") },
      x: { grid: { color: GRID_COLOR }, ticks: { color: MUTED_COLOR } },
    },
  }
  return (
    <Bar
      options={options}
      data={{
        labels: groups.map((g) => g.id),
        datasets: [
          {
            label: "一致率 (%)",
            data,
            backgroundColor: data.map((v) =>
              v >= 100 ? MATCH_COLOR : MISMATCH_COLOR
            ),
          },
        ],
      }}
    />
  )
}
