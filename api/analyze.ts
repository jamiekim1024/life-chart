import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MODEL = 'gemini-2.5-flash'

type AnalyzeErrorCode =
  | 'MISSING_API_KEY'
  | 'STORY_TOO_SHORT'
  | 'INVALID_TIMELINE'
  | 'GEMINI_ERROR'

class AnalyzeError extends Error {
  readonly code: AnalyzeErrorCode

  constructor(code: AnalyzeErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AnalyzeError'
    this.code = code
  }
}

interface LifePoint {
  year: number
  score: number
  label: string
}

interface LifeAnalysis {
  timeline: LifePoint[]
  counseling: string
  song: {
    title: string
    artist: string
    reason: string
    youtubeSearchUrl: string
  }
  detectedLanguage: 'ko' | 'en'
  currentScore: number
}

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

function statusForCode(code: string): number {
  switch (code) {
    case 'MISSING_API_KEY':
      return 503
    case 'STORY_TOO_SHORT':
      return 400
    case 'INVALID_TIMELINE':
      return 422
    default:
      return 500
  }
}

function detectInputLanguage(text: string): 'ko' | 'en' {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) ?? []).length
  const latinChars = (text.match(/[a-zA-Z]/g) ?? []).length
  return koreanChars >= latinChars ? 'ko' : 'en'
}

function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonText) as T
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY
  if (!key?.trim()) {
    throw new AnalyzeError('MISSING_API_KEY')
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

async function analyzeStory(story: string): Promise<LifeAnalysis> {
  const trimmed = story.trim()
  if (trimmed.length < 20) {
    throw new AnalyzeError('STORY_TOO_SHORT')
  }
  if (trimmed.length > 12000) {
    throw new AnalyzeError('STORY_TOO_SHORT', 'Story exceeds maximum length')
  }

  const inputLang = detectInputLanguage(trimmed)

  try {
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
      throw new AnalyzeError('INVALID_TIMELINE')
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
  } catch (err) {
    if (err instanceof AnalyzeError) throw err
    throw new AnalyzeError(
      'GEMINI_ERROR',
      err instanceof Error ? err.message : 'Gemini request failed',
    )
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const story =
    typeof req.body === 'string'
      ? (JSON.parse(req.body) as { story?: string }).story
      : (req.body as { story?: string } | undefined)?.story

  if (typeof story !== 'string') {
    res.status(400).json({ error: 'INVALID_BODY' })
    return
  }

  try {
    const analysis = await analyzeStory(story)
    res.status(200).json(analysis)
  } catch (err) {
    if (err instanceof AnalyzeError) {
      res.status(statusForCode(err.code)).json({ error: err.code })
      return
    }
    res.status(500).json({ error: 'GEMINI_ERROR' })
  }
}
