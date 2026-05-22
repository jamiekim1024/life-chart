import type { LifePoint } from '@/types'

export const FUTURE_HOPE_YEAR = 2030

export interface LifeChartRow {
  year: number
  score?: number
  futureScore?: number
  label?: string
}

function hopeTargetScore(lastScore: number): number {
  return Math.min(100, Math.round(lastScore + Math.max(15, (100 - lastScore) * 0.4)))
}

function futureYears(fromYear: number, toYear: number): number[] {
  const span = toYear - fromYear
  if (span <= 0) return []

  const mids: number[] = []
  if (span > 6) {
    mids.push(fromYear + Math.floor(span * 0.35), fromYear + Math.floor(span * 0.65))
  } else if (span > 2) {
    mids.push(fromYear + Math.floor(span / 2))
  }

  return [...new Set([...mids, toYear].filter((y) => y > fromYear))].sort(
    (a, b) => a - b,
  )
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

  for (const year of futureYears(last.year, FUTURE_HOPE_YEAR)) {
    const t = (year - last.year) / (FUTURE_HOPE_YEAR - last.year)
    const eased = Math.pow(t, 0.85)
    rows.push({
      year,
      futureScore: Math.round(last.score + (targetScore - last.score) * eased),
      label: '',
    })
  }

  return rows
}
