import { getOrg, getEvent } from '@/lib/liveheats'
import Link from 'next/link'
export const revalidate = 300
export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let name = '', img: string | null = null
  const results: { eid: string; ename: string; date: string; div: string; place: number; total: number }[] = []
  try {
    const org = await getOrg()
    const past = org.events.filter(e => e.status === 'results_published').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const res = await Promise.allSettled(past.slice(0, 15).map(e => getEvent(e.id)))
    for (const r of res) { if (r.status !== 'fulfilled') continue; const ev = r.value; for (const d of ev.eventDivisions) for (const rk of d.ranking || []) if (rk.competitor.athlete.id === id) { if (!name) name = rk.competitor.athlete.name; if (!img && rk.competitor.athlete.image) img = rk.competitor.athlete.image; results.push({ eid: ev.id, ename: ev.name, date: ev.date, div: d.division.name, place: rk.place, total: rk.total }) } }
  } catch {}
  if (!name) return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Athlete not found.</div>
  const best = results.length ? Math.min(...results.map(r => r.place)) : null
  const avg = results.length ? results.reduce((s, r) => s + r.total, 0) / results.length : null
  const ord = (n: number) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-4xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <Link href="/athletes" style={{ fontSize: '0.8rem', color: 'rgba(26,26,26,0.4)', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block' }}>&larr; Back to Athletes</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#F2EDE4', flexShrink: 0 }}>{img ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.75rem', color: 'rgba(10,37,64,0.15)' }}>{name.charAt(0)}</div>}</div>
          <div><h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#0A2540' }}>{name}</h1><p style={{ fontSize: '0.85rem', color: 'rgba(26,26,26,0.4)' }}>Barbados</p></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '3rem' }}>
          {[{ l: 'Events', v: String(results.length) }, { l: 'Best Finish', v: best ? ord(best) : '-' }, { l: 'Avg Score', v: avg ? avg.toFixed(2) : '-' }].map(s => <div key={s.l} style={{ backgroundColor: '#F2EDE4', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}><div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.5rem', color: '#0A2540' }}>{s.v}</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,26,26,0.35)', marginTop: '0.25rem' }}>{s.l}</div></div>)}
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#0A2540', marginBottom: '1rem' }}>Competition History</h2>
        <div style={{ backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {results.map((r, i) => <Link key={`${r.eid}-${r.div}`} href={`/events/${r.eid}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', padding: '0.875rem 1.25rem', textDecoration: 'none', borderBottom: i < results.length - 1 ? '1px solid rgba(26,26,26,0.04)' : 'none', alignItems: 'center', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAF8' }}><div><div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#0A2540' }}>{r.ename}</div><div style={{ fontSize: '0.75rem', color: 'rgba(26,26,26,0.35)' }}>{r.div} &middot; {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.8rem', color: r.place <= 3 ? '#1478B5' : 'rgba(26,26,26,0.4)' }}>#{r.place}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)}</span></Link>)}
        </div>
      </div>
    </div>
  )
}
