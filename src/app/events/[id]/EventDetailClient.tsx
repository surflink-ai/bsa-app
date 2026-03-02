'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { PhotoGallery } from '../../components/PhotoGallery'
import { ChevronDownIcon } from '../../components/Icons'
import type { EventDivisionFull } from '@/lib/liveheats'

interface Photo { src: string; alt?: string; credit?: string }

export function EventDetailClient({ event, photos }: { event: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] }; photos?: Photo[] }) {
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const div = event.eventDivisions[tab]
  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal>
          <Link href="/events" style={{ fontSize: '0.8rem', color: 'rgba(26,26,26,0.4)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>&larr; Back to Events</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.5rem)', color: '#0A2540' }}>{event.name}</h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: event.status === 'results_published' ? 'rgba(20,120,181,0.1)' : 'rgba(43,165,160,0.1)', color: event.status === 'results_published' ? '#1478B5' : '#2BA5A0', textTransform: 'uppercase' }}>{event.status === 'results_published' ? 'Results' : event.status}</span>
          </div>
          <p style={{ color: 'rgba(26,26,26,0.4)', fontSize: '0.9rem', marginBottom: '2rem' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </ScrollReveal>
        {event.eventDivisions.length > 0 && <ScrollReveal><div className="no-scrollbar" style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', marginBottom: '2rem' }}>{event.eventDivisions.map((d, i) => <button key={d.id} onClick={() => { setTab(i); setOpen(null) }} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem', fontWeight: 500, padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: tab === i ? '#0A2540' : '#F2EDE4', color: tab === i ? '#fff' : 'rgba(26,26,26,0.5)' }}>{d.division.name}</button>)}</div></ScrollReveal>}
        {div?.ranking && div.ranking.length > 0 && <ScrollReveal>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1rem', color: '#0A2540', marginBottom: '1rem' }}>Final Rankings</h2>
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '2.5rem' }}>
            {div.ranking.map((r, i) => (
              <Link key={i} href={`/athletes/${r.competitor.athlete.id}`} style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1.25rem', gap: '1rem', textDecoration: 'none', borderBottom: i < div.ranking.length - 1 ? '1px solid rgba(26,26,26,0.04)' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#FFFFFF' }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.85rem', color: i < 3 ? '#1478B5' : 'rgba(26,26,26,0.3)', width: '2rem', textAlign: 'center' }}>{r.place}</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F2EDE4', overflow: 'hidden', flexShrink: 0 }}>{r.competitor.athlete.image ? <img src={r.competitor.athlete.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(10,37,64,0.2)' }}>{r.competitor.athlete.name.charAt(0)}</div>}</div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: '#0A2540' }}>{r.competitor.athlete.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.85rem', color: 'rgba(26,26,26,0.5)' }}>{r.total?.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </ScrollReveal>}
        {div?.heats && div.heats.length > 0 && <ScrollReveal>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1rem', color: '#0A2540', marginBottom: '1rem' }}>Heat Results</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {div.heats.map(h => (
              <div key={h.id} style={{ backgroundColor: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <button onClick={() => setOpen(open === h.id ? null : h.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#0A2540' }}><span>{h.round} &middot; Heat {h.position}</span><span style={{ transform: open === h.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'rgba(26,26,26,0.3)' }}><ChevronDownIcon size={18} /></span></button>
                {open === h.id && h.result && <div style={{ borderTop: '1px solid rgba(26,26,26,0.04)' }}>{h.result.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1.25rem', gap: '0.75rem', borderBottom: i < h.result.length - 1 ? '1px solid rgba(26,26,26,0.04)' : 'none' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.8rem', color: r.place === 1 ? '#1478B5' : 'rgba(26,26,26,0.3)', width: '1.5rem', textAlign: 'center' }}>{r.place}</span><span style={{ flex: 1, fontSize: '0.85rem', color: '#0A2540', fontWeight: 500 }}>{r.competitor.athlete.name}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '0.85rem', color: r.place === 1 ? '#1478B5' : 'rgba(26,26,26,0.5)' }}>{r.total?.toFixed(2)}</span></div>)}</div>}
              </div>
            ))}
          </div>
        </ScrollReveal>}
        {photos && photos.length > 0 && <ScrollReveal><div style={{ marginTop: '2.5rem' }}><PhotoGallery photos={photos} /></div></ScrollReveal>}
      </div>
    </div>
  )
}
