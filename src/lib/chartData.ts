import type { LifePoint } from '@/types'

export const FUTURE_HOPE_YEAR = 2030

export interface LifeChartRow {
  year: number
  score?: number
  futureScore?: number
  label?: string
}

function hopeTargetScore(lastScore: number): number {
  return Math.min(
    100,
    Math.round(lastScore + Math.max(22, (100 - lastScore) * 0.6)),
  )
}

/** Ease-out quart: accelerates upward toward the end (optimistic recovery). */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function futureYearPoints(fromYear: number, toYear: number): number[] {
  const span = toYear - fromYear
  if (span <= 0) return []

  const steps = Math.min(10, Math.max(5, Math.round(span / 2)))
  const years: number[] = []
  for (let i = 1; i <= steps; i++) {
    years.push(Math.round(fromYear + (span * i) / steps))
  }
  if (years[years.length - 1] !== toYear) {
    years.push(toYear)
  }
  return [...new Set(years)].sort((a, b) => a - b)
}

/** Merges timeline with dashed future hope curve ending at 2030. */
export function buildLifeChartData(data: LifePoint[]): LifeChartRow[] {
  if (data.length === 0) return []

  const last = data[data.length - 1]
  const targetScore = hopeTargetScore(last.score)

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
