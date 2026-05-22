import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeStory, AnalyzeError } from '../lib/analyzeStory'

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
