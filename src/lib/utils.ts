import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function detectInputLanguage(text: string): 'ko' | 'en' {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) ?? []).length
  const latinChars = (text.match(/[a-zA-Z]/g) ?? []).length
  return koreanChars >= latinChars ? 'ko' : 'en'
}

export function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(jsonText) as T
}
