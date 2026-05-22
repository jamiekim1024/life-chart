import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download } from 'lucide-react'
import { QRCode } from 'react-qr-code'
import { useTranslation } from 'react-i18next'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from 'recharts'
import type { LifeAnalysis } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StoryCardProps {
  analysis: LifeAnalysis
  appUrl: string
}

export function StoryCard({ analysis, appUrl }: StoryCardProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const latest = analysis.timeline[analysis.timeline.length - 1]

  const handleDownload = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `life-chart-story-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('story.title')}</CardTitle>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => void handleDownload()}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? t('story.generating') : t('story.download')}
        </Button>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div
          ref={cardRef}
          className="flex w-[270px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg"
          style={{ aspectRatio: '9 / 16' }}
        >
          <div className="flex flex-1 flex-col p-5">
            <p className="text-[10px] font-medium tracking-widest text-neutral-400 uppercase">
              {t('app.title')}
            </p>
            <h4 className="mt-1 text-lg font-bold leading-tight">
              {t('chart.lifeTitle')}
            </h4>
            <p className="mt-1 text-xs text-neutral-500">
              {latest.year} · {t('chart.score')} {latest.score}
            </p>

            <div className="mt-3 h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.timeline}>
                  <YAxis hide domain={[0, 100]} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0a0a0a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-neutral-600">
              {latest.label}
            </p>

            <p className="mt-auto pt-4 text-[10px] leading-snug text-neutral-500">
              {analysis.counseling.slice(0, 120)}
              {analysis.counseling.length > 120 ? '…' : ''}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-5 py-4">
            <div>
              <p className="text-[10px] text-neutral-500">{t('story.scan')}</p>
              <p className="text-xs font-medium">{t('story.footer')}</p>
            </div>
            <div className="rounded-lg bg-white p-1.5">
              <QRCode value={appUrl} size={56} level="M" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
