import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LifePoint } from '@/types'
import {
  AMAZON_STOCK,
  buildAmazonComparisonSeries,
} from '@/lib/stockComparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ComparisonChartProps {
  timeline: LifePoint[]
}

export function ComparisonChart({ timeline }: ComparisonChartProps) {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language.startsWith('ko')

  const data = useMemo(
    () => buildAmazonComparisonSeries(timeline),
    [timeline],
  )

  const story = isKo ? AMAZON_STOCK.storyKo : AMAZON_STOCK.storyEn

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('comparison.title')}</CardTitle>
        <p className="text-sm text-neutral-500">{t('comparison.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-base font-semibold">
            {AMAZON_STOCK.name}{' '}
            <span className="font-normal text-neutral-500">
              ({AMAZON_STOCK.ticker})
            </span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {story}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            {t('comparison.amazonNote')}
          </p>
        </div>
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fill: '#737373', fontSize: 11 }}
                axisLine={{ stroke: '#e5e5e5' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#737373', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                formatter={(value, name) => {
                  const n = typeof value === 'number' ? value : Number(value)
                  const label =
                    name === 'lifeScore'
                      ? t('comparison.yourLife')
                      : t('comparison.amazon')
                  return [Number.isFinite(n) ? n : '—', label]
                }}
                labelFormatter={(year) =>
                  isKo ? `${year}년` : String(year)
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) =>
                  value === 'lifeScore'
                    ? t('comparison.yourLife')
                    : t('comparison.amazon')
                }
              />
              <Line
                type="monotone"
                dataKey="lifeScore"
                name="lifeScore"
                stroke="#0a0a0a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0a0a0a' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="amazonScore"
                name="amazonScore"
                stroke="#a3a3a3"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
