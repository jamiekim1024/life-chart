import { useTranslation } from 'react-i18next'

interface TooltipPayloadItem {
  payload?: {
    year?: number
    score?: number
    futureScore?: number
    label?: string
  }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const { t } = useTranslation()

  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const displayScore = point.score ?? point.futureScore
  const isFuture = point.score == null && point.futureScore != null

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs text-neutral-500">
        {t('chart.year')}:{' '}
        <span className="font-semibold text-neutral-900">{point.year}</span>
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {t('chart.score')}:{' '}
        <span className="font-semibold text-neutral-900">{displayScore}</span>
      </p>
      {isFuture ? (
        <p className="mt-1 text-xs text-neutral-400">{t('chart.futureHope')}</p>
      ) : null}
      {point.label ? (
        <p className="mt-2 max-w-[220px] text-sm leading-snug text-neutral-800">
          {point.label}
        </p>
      ) : null}
    </div>
  )
}
