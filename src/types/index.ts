export interface LifePoint {
  year: number
  score: number
  label: string
}

export interface SongRecommendation {
  title: string
  artist: string
  reason: string
  youtubeSearchUrl: string
}

export interface LifeAnalysis {
  timeline: LifePoint[]
  counseling: string
  song: SongRecommendation
  detectedLanguage: 'ko' | 'en'
  currentScore: number
  mood?: string
}

export interface ChartPoint {
  year: number
  score: number
  label?: string
}
