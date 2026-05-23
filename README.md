# Life Chart

Turn your life story into an emotional stock-style chart with AI counseling, song recommendations, and Instagram story export.

## Tech stack

- React + Vite + TypeScript
- Vercel serverless API (`api/analyze.ts`, self-contained) for Gemini
- Tailwind CSS v4 + shadcn-style UI primitives
- Recharts
- Google Gemini (`gemini-1.5-flash`, server-side only)
- i18n (KO / EN)
- CountAPI visitor counter
- html-to-image + QR code for story cards

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and add your Gemini API key:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` and `SONGS_SHEET_CSV_URL` in `.env` (no `VITE_` prefix — secrets stay on the server).

### Google Sheet for songs

1. Create a sheet with columns: `title`, `artist`, `youtube_url`, `mood`, `language` (`KO` or `EN`)
2. **File → Share → Publish to web → CSV**
3. Paste the published CSV URL into `SONGS_SHEET_CSV_URL`

Mood column must use one of: `sad`, `hopeful`, `joyful`, `nostalgic`. Legacy tags in the sheet are still accepted (`melancholic`/`anxious` → sad; `resilient`/`healing`/`reflective`/`grateful` → hopeful).

3. Local development with API routes:

```bash
npm run dev:vercel
```

This runs Vercel dev (frontend + `/api/analyze`). Alternatively, run `vercel dev` in one terminal and `npm run dev` in another; Vite proxies `/api` to port 3000.

4. Deploy on Vercel and add `GEMINI_API_KEY` and `SONGS_SHEET_CSV_URL` in Project → Settings → Environment Variables.

## Scripts

- `npm run dev` — Vite only (needs `vercel dev` for `/api` or use proxy)
- `npm run dev:vercel` — full stack via Vercel CLI
- `npm run build` — production build
- `npm run preview` — preview production build

## API

`POST /api/analyze`

```json
{ "story": "Your life story text..." }
```

Returns `LifeAnalysis` JSON or `{ "error": "STORY_TOO_SHORT" }` with an appropriate status code.

## Features

- Free-text life story → Gemini JSON timeline (`year`, `score`, `label`)
- Full-width smooth line chart with custom tooltip and dashed future hope line to 2030
- Stock-pattern comparison (recovery vs sustain by current score)
- AI counseling message
- Song recommendation (Korean classics / English 60s–90s) + YouTube search link
- 9:16 Instagram story card export with QR code
- Optional $0.99 donation link (configure URL in `DonationButton.tsx`)
