import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('en') ? 'en' : 'ko'

  const setLang = (lng: 'ko' | 'en') => {
    void i18n.changeLanguage(lng)
    localStorage.setItem('life-chart-lang', lng)
    document.documentElement.lang = lng
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-neutral-200 p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {(['ko', 'en'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => setLang(lng)}
          className={cn(
            'rounded-full px-3 py-1.5 transition-colors',
            current === lng
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-500 hover:text-neutral-900',
          )}
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  )
}
