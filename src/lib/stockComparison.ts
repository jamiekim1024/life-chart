import type { ChartPoint } from '@/types'

/** Recovery pattern: dip then gradual climb (like post-crash markets). */
const RECOVERY_TEMPLATE: { t: number; v: number }[] = [
  { t: 0, v: 72 },
  { t: 1, v: 58 },
  { t: 2, v: 38 },
  { t: 3, v: 28 },
  { t: 4, v: 35 },
  { t: 5, v: 48 },
  { t: 6, v: 55 },
  { t: 7, v: 62 },
  { t: 8, v: 68 },
  { t: 9, v: 74 },
]

/** Sustain pattern: elevated plateau with mild volatility. */
const SUSTAIN_TEMPLATE: { t: number; v: number }[] = [
  { t: 0, v: 58 },
  { t: 1, v: 65 },
  { t: 2, v: 72 },
  { t: 3, v: 78 },
  { t: 4, v: 82 },
  { t: 5, v: 79 },
  { t: 6, v: 85 },
  { t: 7, v: 83 },
  { t: 8, v: 88 },
  { t: 9, v: 86 },
]

function buildSeries(
  template: { t: number; v: number }[],
  startYear: number,
  anchorScore: number,
): ChartPoint[] {
  const last = template[template.length - 1].v
  const scale = anchorScore / last

  return template.map((point) => ({
    year: startYear + point.t,
    score: Math.round(Math.min(100, Math.max(0, point.v * scale))),
  }))
}

export type ComparisonMode = 'recovery' | 'sustain'

export function getComparisonMode(currentScore: number): ComparisonMode {
  return currentScore < 55 ? 'recovery' : 'sustain'
}

export function getComparisonChart(
  mode: ComparisonMode,
  startYear: number,
  currentScore: number,
): ChartPoint[] {
  const template = mode === 'recovery' ? RECOVERY_TEMPLATE : SUSTAIN_TEMPLATE
  return buildSeries(template, startYear, currentScore)
}

export function getComparisonLabelKey(mode: ComparisonMode): string {
  return mode === 'recovery' ? 'comparison.recovery' : 'comparison.sustain'
}
