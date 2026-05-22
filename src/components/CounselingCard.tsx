import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CounselingCardProps {
  message: string
}

export function CounselingCard({ message }: CounselingCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('counseling.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[15px] leading-relaxed text-neutral-700 whitespace-pre-wrap">
          {message}
        </p>
      </CardContent>
    </Card>
  )
}
