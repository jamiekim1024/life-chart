import type { LifeAnalysis } from '@/types'

interface AnalyzeErrorResponse {
  error?: string
}

export async function analyzeLifeStory(story: string): Promise<LifeAnalysis> {
  const trimmed = story.trim()
  if (trimmed.length < 20) {
    throw new Error('STORY_TOO_SHORT')
  }

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ story: trimmed }),
  })

  const data = (await res.json()) as LifeAnalysis | AnalyzeErrorResponse

  if (!res.ok) {
    const code =
      typeof data === 'object' && data && 'error' in data && data.error
        ? String(data.error)
        : 'GENERIC'
    throw new Error(code)
  }

  return data as LifeAnalysis
}
