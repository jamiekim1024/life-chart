/**
 * Self-contained Vercel serverless handler.
 * Do not import from ../lib or other local paths — only node_modules.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MODEL = 'gemini-2.0-flash'

/** Public song list (override via SONGS_SHEET_CSV_URL on Vercel). */
const DEFAULT_SONGS_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQd3VYvjuqSw4hj-5pPLzr-OH1-OaSJSKiWpYi_n9aKm7Z8Y1tqklrNKI3Rvqu3DtqXmDDDUZvLQMC9/pub?output=csv'

type CanonicalMood = 'sad' | 'hopeful' | 'joyful' | 'nostalgic'

const MOODS: CanonicalMood[] = ['sad', 'hopeful', 'joyful', 'nostalgic']

/** Maps legacy sheet / AI mood tags to the 4 canonical values. */
const MOOD_ALIASES: Record<string, CanonicalMood> = {
  sad: 'sad',
  hopeful: 'hopeful',
  joyful: 'joyful',
  nostalgic: 'nostalgic',
  melancholic: 'sad',
  anxious: 'sad',
  resilient: 'hopeful',
  healing: 'hopeful',
  reflective: 'hopeful',
  grateful: 'hopeful',
}

type AnalyzeErrorCode =
  | 'MISSING_API_KEY'
  | 'MISSING_SONGS_SHEET'
  | 'STORY_TOO_SHORT'
  | 'INVALID_TIMELINE'
  | 'GEMINI_ERROR'
  | 'SONGS_FETCH_FAILED'

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
  mood: string
}

interface GeminiRawResponse {
  timeline: LifePoint[]
  counseling: string
  mood: string
  songReason: string
  detectedLanguage?: 'ko' | 'en'
}

interface SheetSong {
  title: string
  artist: string
  youtube_url: string
  mood: string
  language: string
}

function statusForCode(code: string): number {
  switch (code) {
    case 'MISSING_API_KEY':
    case 'MISSING_SONGS_SHEET':
      return 503
    case 'STORY_TOO_SHORT':
      return 400
    case 'INVALID_TIMELINE':
      return 422
    case 'SONGS_FETCH_FAILED':
      return 502
    default:
      return 500
  }
}

function parseUiLanguage(raw: unknown): 'ko' | 'en' {
  return raw === 'en' ? 'en' : 'ko'
}

function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonText) as T
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  fields.push(current.trim())
  return fields
}

function parseSongsCsv(csv: string): SheetSong[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(normalizeKey)
  const idx = {
    title: headers.indexOf('title'),
    artist: headers.indexOf('artist'),
    youtube_url: headers.indexOf('youtube_url'),
    mood: headers.indexOf('mood'),
    language: headers.indexOf('language'),
  }

  if (
    idx.title < 0 ||
    idx.artist < 0 ||
    idx.youtube_url < 0 ||
    idx.mood < 0 ||
    idx.language < 0
  ) {
    return []
  }

  const songs: SheetSong[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < headers.length) continue
    const title = cols[idx.title]
    const artist = cols[idx.artist]
    const youtube_url = cols[idx.youtube_url]
    if (!title || !artist || !youtube_url) continue
    songs.push({
      title,
      artist,
      youtube_url,
      mood: cols[idx.mood],
      language: cols[idx.language],
    })
  }
  return songs
}

function sheetLanguageCode(lang: 'ko' | 'en'): string {
  return lang === 'ko' ? 'KO' : 'EN'
}

function normalizeMood(m: string): string {
  return m.trim().toLowerCase()
}

function canonicalizeMood(raw: string): CanonicalMood {
  return MOOD_ALIASES[normalizeMood(raw)] ?? 'hopeful'
}

let songsCache: { fetchedAt: number; songs: SheetSong[] } | null = null
const CACHE_MS = 5 * 60 * 1000

async function fetchSongsFromSheet(): Promise<SheetSong[]> {
  const url =
    process.env.SONGS_SHEET_CSV_URL?.trim() || DEFAULT_SONGS_SHEET_CSV_URL

  if (songsCache && Date.now() - songsCache.fetchedAt < CACHE_MS) {
    return songsCache.songs
  }

  const res = await fetch(url, { headers: { Accept: 'text/csv' } })
  if (!res.ok) {
    throw new AnalyzeError('SONGS_FETCH_FAILED')
  }

  const csv = await res.text()
  const songs = parseSongsCsv(csv)
  if (songs.length === 0) {
    throw new AnalyzeError('SONGS_FETCH_FAILED', 'No songs parsed from sheet')
  }

  songsCache = { fetchedAt: Date.now(), songs }
  return songs
}

function pickSong(
  songs: SheetSong[],
  mood: CanonicalMood,
  lang: 'ko' | 'en',
): SheetSong {
  const langCode = sheetLanguageCode(lang)

  const inLang = songs.filter(
    (s) => s.language.trim().toUpperCase() === langCode,
  )

  const moodMatch = inLang.filter(
    (s) => canonicalizeMood(s.mood) === mood,
  )
  const pool = moodMatch.length > 0 ? moodMatch : inLang
  const fallback = pool.length > 0 ? pool : songs

  return fallback[Math.floor(Math.random() * fallback.length)]
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY
  if (!key?.trim()) {
    throw new AnalyzeError('MISSING_API_KEY')
  }
  return new GoogleGenerativeAI(key)
}

function buildPrompt(story: string, lang: 'ko' | 'en'): string {
  const languageName = lang === 'ko' ? 'Korean' : 'English'
  const moodList = MOODS.join(', ') // sad, hopeful, joyful, nostalgic only

  const labelRule =
    lang === 'ko'
      ? 'label: vivid Korean phrase for the life moment (no year prefix), like "호주 브리스번으로 이주, 새로운 시작을 꿈꾸던 시절" (max 55 chars)'
      : 'label: vivid English phrase for the life moment (no year prefix), like "moving abroad and daring to start over" (max 55 chars)'

  return `You are a compassionate life coach and data analyst. Analyze the user's life story and respond ONLY with valid JSON (no markdown).

CRITICAL: The user selected UI language is ${languageName}. Write ALL text fields (timeline labels, counseling, songReason) ONLY in ${languageName}. Do not mix languages.

Rules:
- Extract 6–12 key life moments as timeline points with year (integer), score (0–100 emotion/wellbeing), and ${labelRule}.
- Years must be realistic and ordered ascending.
- counseling: 2–4 warm, practical sentences in ${languageName}.
- mood: pick exactly ONE from [${moodList}] only (no other values). sad = sorrow/anxiety; hopeful = resilience/growth; joyful = happiness; nostalgic = memory/longing.
- songReason: one sentence in ${languageName} explaining why a song with that mood would comfort the user (do not name a specific song).
- detectedLanguage: "${lang}"

JSON schema:
{
  "timeline": [{"year": 2010, "score": 45, "label": "..."}],
  "counseling": "...",
  "mood": "hopeful",
  "songReason": "...",
  "detectedLanguage": "${lang}"
}

User life story:
"""
${story}
"""`
}

async function runLifeAnalysis(
  story: string,
  lang: 'ko' | 'en',
): Promise<LifeAnalysis> {
  const trimmed = story.trim()
  if (trimmed.length < 20) {
    throw new AnalyzeError('STORY_TOO_SHORT')
  }
  if (trimmed.length > 12000) {
    throw new AnalyzeError('STORY_TOO_SHORT', 'Story exceeds maximum length')
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(buildPrompt(trimmed, lang))
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

    const mood = canonicalizeMood(parsed.mood ?? 'hopeful')

    const sheetSongs = await fetchSongsFromSheet()
    const picked = pickSong(sheetSongs, mood, lang)
    const resolvedLang = parsed.detectedLanguage === 'en' ? 'en' : lang

    const currentScore = timeline[timeline.length - 1].score

    return {
      timeline,
      counseling: parsed.counseling,
      mood,
      song: {
        title: picked.title,
        artist: picked.artist,
        reason: parsed.songReason,
        youtubeSearchUrl: picked.youtube_url,
      },
      detectedLanguage: resolvedLang,
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

  const body =
    typeof req.body === 'string'
      ? (JSON.parse(req.body) as { story?: string; language?: string })
      : (req.body as { story?: string; language?: string } | undefined)

  const story = body?.story
  const language = parseUiLanguage(body?.language)

  if (typeof story !== 'string') {
    res.status(400).json({ error: 'INVALID_BODY' })
    return
  }

  try {
    const analysis = await runLifeAnalysis(story, language)
    res.status(200).json(analysis)
  } catch (err) {
    if (err instanceof AnalyzeError) {
      res.status(statusForCode(err.code)).json({ error: err.code })
      return
    }
    res.status(500).json({ error: 'GEMINI_ERROR' })
  }
}
