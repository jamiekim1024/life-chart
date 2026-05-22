export interface RecoveryStock {
  id: string
  name: string
  ticker: string
  storyKo: string
  storyEn: string
  /** Normalized 0–100 price path (dip → recovery). */
  scores: number[]
}

/** Hardcoded dip-and-recovery arcs inspired by real US market histories. */
export const RECOVERY_STOCKS: RecoveryStock[] = [
  {
    id: 'amzn',
    name: 'Amazon',
    ticker: 'AMZN',
    storyKo:
      '2000년 닷컴 버블로 90% 이상 폭락했지만, 결국 세계 최고 기업 중 하나가 되었습니다.',
    storyEn:
      'It crashed over 90% in the 2000 dot-com bust, then grew into one of the world’s most valuable companies.',
    scores: [92, 78, 55, 28, 18, 32, 48, 62, 78, 88, 100],
  },
  {
    id: 'aapl',
    name: 'Apple',
    ticker: 'AAPL',
    storyKo:
      '1990년대 파산 위기 직전까지 갔지만, 혁신의 연속으로 역사상 가장 성공적인 기업 중 하나가 되었습니다.',
    storyEn:
      'It nearly went bankrupt in the 1990s, then rebounded through relentless innovation into an all-time great.',
    scores: [22, 18, 25, 35, 42, 38, 55, 68, 82, 94, 100],
  },
  {
    id: 'nflx',
    name: 'Netflix',
    ticker: 'NFLX',
    storyKo:
      '2011년 위기로 주가가 급락했지만, 오리지널 콘텐츠로 글로벌 스트리밍 1위를 차지했습니다.',
    storyEn:
      'Its stock plunged in the 2011 crisis, then climbed back to lead global streaming through original content.',
    scores: [88, 82, 75, 24, 30, 45, 58, 72, 85, 96, 100],
  },
]

export function getRecoveryStockChartData(
  stock: RecoveryStock,
  startYear: number,
): { year: number; score: number }[] {
  return stock.scores.map((score, i) => ({
    year: startYear + i,
    score,
  }))
}
