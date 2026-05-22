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
import { buildLifeChartData, FUTURE_HOPE_YEAR } from '@/lib/chartData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartTooltip } from '@/components/ChartTooltip'

interface LifeChartProps {
  data: LifePoint[]
}

export function LifeChart({ data }: LifeChartProps) {
  const { t } = useTranslation()
  const chartData = useMemo(() => buildLifeChartData(data), [data])
  const xMax = Math.max(
    FUTURE_HOPE_YEAR,
    ...chartData.map((p) => p.year),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('chart.lifeTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                domain={['dataMin', xMax]}
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
                stroke="#0a0a0a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0a0a0a' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="futureScore"
                stroke="#a3a3a3"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
