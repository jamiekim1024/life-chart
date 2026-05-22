import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { analyzeLifeStory } from '@/lib/analyze'
import type { LifeAnalysis } from '@/types'
import { LanguageToggle } from '@/components/LanguageToggle'
import { VisitorCounter } from '@/components/VisitorCounter'
import { LifeChart } from '@/components/LifeChart'
import { ComparisonChart } from '@/components/ComparisonChart'
import { CounselingCard } from '@/components/CounselingCard'
import { SongRecommendation } from '@/components/SongRecommendation'
import { StoryCard } from '@/components/StoryCard'
import { DonationButton } from '@/components/DonationButton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function mapError(code: string, t: (key: string) => string): string {
  switch (code) {
    case 'MISSING_API_KEY':
      return t('errors.missingKey')
    case 'STORY_TOO_SHORT':
      return t('errors.tooShort')
    case 'INVALID_TIMELINE':
      return t('errors.invalid')
    case 'GEMINI_ERROR':
    case 'INVALID_BODY':
    case 'METHOD_NOT_ALLOWED':
      return t('errors.generic')
    default:
      return t('errors.generic')
  }
}

export default function App() {
  const { t, i18n } = useTranslation()
  const uiLang = i18n.language.startsWith('en') ? 'en' : 'ko'
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<LifeAnalysis | null>(null)

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://life-chart.app'

  const handleAnalyze = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await analyzeLifeStory(story, uiLang)
      setAnalysis(result)
    } catch (e) {
      const message =
        e instanceof Error ? mapError(e.message, t) : t('errors.generic')
      setAnalysis(null)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t('app.title')}
            </h1>
            <p className="text-xs text-neutral-500 sm:text-sm">
              {t('app.subtitle')}
            </p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-4 text-center sm:text-left">
          <p className="text-sm text-neutral-500">{t('app.tagline')}</p>

          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder={t('input.placeholder')}
            disabled={loading}
            aria-label={t('input.placeholder')}
          />
          <p className="text-xs text-neutral-400">{t('input.hint')}</p>

          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => void handleAnalyze()}
            disabled={loading || story.trim().length < 20}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('input.analyzing')}
              </>
            ) : (
              t('input.analyze')
            )}
          </Button>
        </section>

        {analysis ? (
          <section className="space-y-6">
            <LifeChart data={analysis.timeline} />
            <ComparisonChart timeline={analysis.timeline} />
            <CounselingCard message={analysis.counseling} />
            <SongRecommendation song={analysis.song} />
            <StoryCard analysis={analysis} appUrl={appUrl} />
            <DonationButton />
          </section>
        ) : null}
      </main>

      <VisitorCounter />
    </div>
  )
}
