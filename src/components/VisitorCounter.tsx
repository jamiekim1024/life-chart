import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { incrementAndGetVisitors } from '@/lib/countapi'

export function VisitorCounter() {
  const { t } = useTranslation()
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    void incrementAndGetVisitors().then(setCount)
  }, [])

  return (
    <p className="fixed bottom-4 left-4 z-40 text-[11px] text-neutral-400">
      {t('visitor')}
      {count !== null ? `: ${count.toLocaleString()}` : '…'}
    </p>
  )
}
