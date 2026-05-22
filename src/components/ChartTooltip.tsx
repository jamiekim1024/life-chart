import { useTranslation } from 'react-i18next'
import { formatLifeTooltip } from '@/lib/tooltipFormat'

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
  const { i18n } = useTranslation()

  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point || point.year == null) return null

  const displayScore = point.score ?? point.futureScore
  if (displayScore == null) return null

  const isFuture = point.score == null && point.futureScore != null
  const line = formatLifeTooltip(
    point.year,
    displayScore,
    point.label,
    i18n.language,
    isFuture,
  )

  return (
    <div className="max-w-[280px] rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm leading-relaxed text-neutral-800">{line}</p>
    </div>
  )
}
