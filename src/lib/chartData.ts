import type { LifePoint } from '@/types'

export const FUTURE_HOPE_YEAR = 2030
export const CHART_Y_MAX = 125

export interface LifeChartRow {
  year: number
  score?: number
  futureScore?: number
  label?: string
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function futureYearPoints(fromYear: number, toYear: number): number[] {
  const span = toYear - fromYear
  if (span <= 0) return []

  const steps = Math.min(12, Math.max(6, Math.round(span / 2)))
  const years: number[] = []
  for (let i = 1; i <= steps; i++) {
    years.push(Math.round(fromYear + (span * i) / steps))
  }
  if (years[years.length - 1] !== toYear) {
    years.push(toYear)
  }
  return [...new Set(years)].sort((a, b) => a - b)
}

/** Target sits above all-time high so the dashed arc reads as breakout hope. */
function hopeTargetScore(allTimeHigh: number, lastScore: number): number {
  const floor = allTimeHigh + Math.max(18, Math.round((CHART_Y_MAX - allTimeHigh) * 0.45))
  const fromLast = lastScore + Math.max(22, Math.round((CHART_Y_MAX - lastScore) * 0.55))
  return Math.min(CHART_Y_MAX - 2, Math.max(floor, fromLast))
}

export function getChartYMax(data: LifePoint[], chartRows: LifeChartRow[]): number {
  const values = [
    ...data.map((p) => p.score),
    ...chartRows
      .map((p) => p.futureScore)
      .filter((v): v is number => v != null),
  ]
  const peak = values.length ? Math.max(...values) : 100
  return Math.max(CHART_Y_MAX, Math.ceil(peak / 10) * 10 + 5)
}

/** Past (solid) + future (dashed) share the junction value for a smooth join. */
export function buildLifeChartData(data: LifePoint[]): LifeChartRow[] {
  if (data.length === 0) return []

  const last = data[data.length - 1]
  const allTimeHigh = Math.max(...data.map((p) => p.score))
  const targetScore = hopeTargetScore(allTimeHigh, last.score)

  const rows: LifeChartRow[] = data.map((point, index) => ({
    year: point.year,
    score: point.score,
    label: point.label,
    futureScore: index === data.length - 1 ? point.score : undefined,
  }))

  if (last.year >= FUTURE_HOPE_YEAR) return rows

  const years = futureYearPoints(last.year, FUTURE_HOPE_YEAR)
  const span = FUTURE_HOPE_YEAR - last.year

  for (const year of years) {
    const t = (year - last.year) / span
    const eased = easeOutQuart(t)
    rows.push({
      year,
      futureScore: Math.round(
        last.score + (targetScore - last.score) * eased,
      ),
      label: '',
    })
  }

  return rows
}
