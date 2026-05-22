const NAMESPACE = 'life-chart-app'
const KEY = 'visitors'

export async function incrementAndGetVisitors(): Promise<number | null> {
  try {
    const hitRes = await fetch(
      `https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`,
    )
    if (!hitRes.ok) return null
    const hitData = (await hitRes.json()) as { value?: number }
    return typeof hitData.value === 'number' ? hitData.value : null
  } catch {
    return null
  }
}
