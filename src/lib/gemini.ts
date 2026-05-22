import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LifeAnalysis, LifePoint } from '@/types'
import { detectInputLanguage, parseJsonFromModel, youtubeSearchUrl } from '@/lib/utils'

const MODEL = 'gemini-2.5-flash'

interface GeminiRawResponse {
  timeline: LifePoint[]
  counseling: string
  song: {
    title: string
    artist: string
    reason: string
  }
  detectedLanguage?: 'ko' | 'en'
}

function getClient(): GoogleGenerativeAI {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    throw new Error('MISSING_API_KEY')
  }
  return new GoogleGenerativeAI(key)
}

function buildPrompt(story: string, inputLang: 'ko' | 'en'): string {
  const songRule =
    inputLang === 'ko'
      ? 'Recommend ONE Korean classic song (한국 고전/명곡, 1970s–2000s era preferred).'
      : 'Recommend ONE English classic song from the 1960s–1990s.'

  return `You are a compassionate life coach and data analyst. Analyze the user's life story and respond ONLY with valid JSON (no markdown).

Rules:
- Extract 6–12 key life moments as timeline points with year (integer), score (0–100 emotion/wellbeing), and label (short event summary, max 40 chars).
- Years must be realistic and ordered ascending.
- counseling: 2–4 warm, practical sentences in the same language as the user's story (${inputLang === 'ko' ? 'Korean' : 'English'}).
- ${songRule}
- detectedLanguage: "${inputLang}"

JSON schema:
{
  "timeline": [{"year": 2010, "score": 45, "label": "..."}],
  "counseling": "...",
  "song": {"title": "...", "artist": "...", "reason": "..."},
  "detectedLanguage": "${inputLang}"
}

User life story:
"""
${story}
"""`
}

export async function analyzeLifeStory(story: string): Promise<LifeAnalysis> {
  const trimmed = story.trim()
  if (trimmed.length < 20) {
    throw new Error('STORY_TOO_SHORT')
  }

  const inputLang = detectInputLanguage(trimmed)
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(buildPrompt(trimmed, inputLang))
  const text = result.response.text()
  const parsed = parseJsonFromModel<GeminiRawResponse>(text)

  const timeline = [...parsed.timeline]
    .filter(
      (p) =>
        typeof p.year === 'number' &&
        typeof p.score === 'number' &&
        typeof p.label === 'string',
    )
    .map((p) => ({
      year: p.year,
      score: Math.min(100, Math.max(0, Math.round(p.score))),
      label: p.label,
    }))
    .sort((a, b) => a.year - b.year)

  if (timeline.length < 2) {
    throw new Error('INVALID_TIMELINE')
  }

  const currentScore = timeline[timeline.length - 1].score
  const lang = parsed.detectedLanguage ?? inputLang
  const searchQuery = `${parsed.song.title} ${parsed.song.artist}`

  return {
    timeline,
    counseling: parsed.counseling,
    song: {
      title: parsed.song.title,
      artist: parsed.song.artist,
      reason: parsed.song.reason,
      youtubeSearchUrl: youtubeSearchUrl(searchQuery),
    },
    detectedLanguage: lang,
    currentScore,
  }
}
