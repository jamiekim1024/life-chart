# Life Chart

Turn your life story into an emotional stock-style chart with AI counseling, song recommendations, and Instagram story export.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS v4 + shadcn-style UI primitives
- Recharts
- Google Gemini (`gemini-2.5-flash`)
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

Set `VITE_GEMINI_API_KEY` in `.env`.

3. Run the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Features

- Free-text life story → Gemini JSON timeline (`year`, `score`, `label`)
- Full-width smooth line chart with custom tooltip
- Stock-pattern comparison (recovery vs sustain by current score)
- AI counseling message
- Song recommendation (Korean classics / English 60s–90s) + YouTube search link
- 9:16 Instagram story card export with QR code
- Optional $0.99 donation link (configure URL in `DonationButton.tsx`)
