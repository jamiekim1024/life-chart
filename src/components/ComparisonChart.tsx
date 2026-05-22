import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LifePoint } from '@/types'
import {
  getComparisonChart,
  getComparisonLabelKey,
  getComparisonMode,
} from '@/lib/stockComparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartTooltip } from '@/components/ChartTooltip'

interface ComparisonChartProps {
  timeline: LifePoint[]
  currentScore: number
}

export function ComparisonChart({
  timeline,
  currentScore,
}: ComparisonChartProps) {
  const { t } = useTranslation()
  const mode = getComparisonMode(currentScore)
  const startYear = timeline[0]?.year ?? new Date().getFullYear() - 9

  const comparisonData = useMemo(
    () =>
      getComparisonChart(mode, startYear, currentScore).map((p) => ({
        ...p,
        label: t('comparison.reference'),
      })),
    [mode, startYear, currentScore, t],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('comparison.title')}</CardTitle>
        <p className="text-sm text-neutral-500">{t(getComparisonLabelKey(mode))}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={comparisonData}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={{ stroke: '#e5e5e5' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#d4d4d4', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#737373"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
