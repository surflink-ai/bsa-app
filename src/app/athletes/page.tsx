import { getOrg, getEvent } from '@/lib/liveheats'
import { AthletesClient } from './AthletesClient'
export const revalidate = 300
export default async function AthletesPage() {
  const map = new Map<string, { id: string; name: string; image: string | null; count: number }>()
  try {
    const org = await getOrg()
    const past = org.events.filter(e => e.status === 'results_published').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const res = await Promise.allSettled(past.slice(0, 10).map(e => getEvent(e.id)))
    for (const r of res) { if (r.status === 'fulfilled') for (const d of r.value.eventDivisions) for (const rk of d.ranking || []) { const a = rk.competitor.athlete; const ex = map.get(a.id); if (ex) { ex.count++; if (a.image && !ex.image) ex.image = a.image } else map.set(a.id, { id: a.id, name: a.name, image: a.image, count: 1 }) } }
  } catch {}
  return <AthletesClient athletes={[...map.values()].sort((a, b) => b.count - a.count)} />
}
