import type { LifePoint } from '@/types'

/** Amazon (AMZN) normalized price path — key years aligned to real history. */
const AMAZON_HISTORY: { year: number; value: number }[] = [
  { year: 1997, value: 10 },
  { year: 1998, value: 42 },
  { year: 1999, value: 100 },
  { year: 2000, value: 58 },
  { year: 2001, value: 14 },
  { year: 2002, value: 18 },
  { year: 2005, value: 26 },
  { year: 2008, value: 34 },
  { year: 2010, value: 40 },
  { year: 2012, value: 48 },
  { year: 2015, value: 58 },
  { year: 2017, value: 74 },
  { year: 2019, value: 90 },
  { year: 2021, value: 100 },
]

const AMAZON_START = 1997
const AMAZON_END = 2021

export const AMAZON_STOCK = {
  name: 'Amazon',
  ticker: 'AMZN',
  storyKo:
    '2000년 닷컴 버블로 90% 폭락했지만, 결국 세계 최고 기업이 됐습니다.',
  storyEn:
    'It crashed ~90% in the 2000 dot-com bust, then became one of the world’s greatest companies.',
}

function interpolateAmazon(amazonYear: number): number {
  if (amazonYear <= AMAZON_HISTORY[0].year) return AMAZON_HISTORY[0].value
  const last = AMAZON_HISTORY[AMAZON_HISTORY.length - 1]
  if (amazonYear >= last.year) return last.value

  for (let i = 0; i < AMAZON_HISTORY.length - 1; i++) {
    const a = AMAZON_HISTORY[i]
    const b = AMAZON_HISTORY[i + 1]
    if (amazonYear >= a.year && amazonYear <= b.year) {
      const t = (amazonYear - a.year) / (b.year - a.year)
      return Math.round(a.value + (b.value - a.value) * t)
    }
  }
  return last.value
}

/** Map a year on the user's X-axis to the proportional Amazon history year. */
function userYearToAmazonYear(
  userYear: number,
  userMin: number,
  userMax: number,
): number {
  if (userMax <= userMin) return AMAZON_START
  const ratio = (userYear - userMin) / (userMax - userMin)
  return AMAZON_START + ratio * (AMAZON_END - AMAZON_START)
}

export interface ComparisonSeriesPoint {
  year: number
  lifeScore?: number
  amazonScore: number
}

/** Overlay Amazon on the user's timeline year range (life scores optional). */
export function buildAmazonComparisonSeries(
  timeline: LifePoint[],
): ComparisonSeriesPoint[] {
  if (timeline.length === 0) return []

  const userMin = timeline[0].year
  const userMax = timeline[timeline.length - 1].year
  const lifeByYear = new Map(timeline.map((p) => [p.year, p.score]))

  const years: number[] = []
  for (let y = userMin; y <= userMax; y++) {
    years.push(y)
  }
  if (years.length < 2) {
    years.push(userMax + 1)
  }

  return years.map((year) => {
    const amazonYear = userYearToAmazonYear(year, userMin, userMax)
    return {
      year,
      lifeScore: lifeByYear.get(year),
      amazonScore: interpolateAmazon(amazonYear),
    }
  })
}
