export function formatLifeTooltip(
  year: number,
  score: number,
  label: string | undefined,
  lang: string,
  isFuture: boolean,
): string {
  const isKo = lang.startsWith('ko')
  const event = label?.trim()

  if (isFuture) {
    if (isKo) {
      return event
        ? `${year}년 · ${score}점 (예상) · ${event}`
        : `${year}년 · ${score}점 — 앞으로의 희망을 향해 천천히 회복할 거예요`
    }
    return event
      ? `${year} · ${score} pts (projected) · ${event}`
      : `${year} · ${score} pts — a gentle climb toward hope ahead`
  }

  if (isKo) {
    return event
      ? `${year}년 · ${score}점 · ${event}`
      : `${year}년 · ${score}점`
  }

  return event ? `${year} · ${score} pts · ${event}` : `${year} · ${score} pts`
}
