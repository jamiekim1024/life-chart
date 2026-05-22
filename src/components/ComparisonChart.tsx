import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { LifePoint } from '@/types'
import {
  getRecoveryStockChartData,
  RECOVERY_STOCKS,
} from '@/lib/stockComparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ComparisonChartProps {
  timeline: LifePoint[]
}

export function ComparisonChart({ timeline }: ComparisonChartProps) {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language.startsWith('ko')
  const startYear = timeline[0]?.year ?? 2000

  const stocks = useMemo(
    () =>
      RECOVERY_STOCKS.map((stock) => ({
        stock,
        data: getRecoveryStockChartData(stock, startYear),
        story: isKo ? stock.storyKo : stock.storyEn,
      })),
    [startYear, isKo],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('comparison.title')}</CardTitle>
        <p className="text-sm text-neutral-500">{t('comparison.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {stocks.map(({ stock, data, story }) => (
          <div
            key={stock.id}
            className="space-y-3 border-b border-neutral-100 pb-8 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-base font-semibold">
                {stock.name}{' '}
                <span className="font-normal text-neutral-500">
                  ({stock.ticker})
                </span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                {story}
              </p>
            </div>
            <div className="h-[180px] w-full sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
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
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#737373"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
