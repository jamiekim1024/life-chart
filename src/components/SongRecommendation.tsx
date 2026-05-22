import { ExternalLink, Music2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SongRecommendation as SongType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SongRecommendationProps {
  song: SongType
}

export function SongRecommendation({ song }: SongRecommendationProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="h-5 w-5" strokeWidth={1.5} />
          {t('song.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-base font-semibold">
            {song.title} — {song.artist}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {song.reason}
          </p>
        </div>
        <Button asChild variant="default" className="w-full sm:w-auto">
          <a
            href={song.youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('song.listen')}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
