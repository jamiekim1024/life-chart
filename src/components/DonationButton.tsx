import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

const DONATION_URL =
  'https://www.buymeacoffee.com/lifechart?utm_source=life-chart-app'

export function DonationButton() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-6 py-5 text-center">
      <Button asChild variant="default" size="lg">
        <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
          <Heart className="h-4 w-4" />
          {t('donation.label')}
        </a>
      </Button>
      <p className="max-w-sm text-xs text-neutral-500">{t('donation.note')}</p>
    </div>
  )
}
