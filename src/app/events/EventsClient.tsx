'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { CalendarIcon, ArrowRightIcon } from '../components/Icons'
import { WaveDivider } from '../components/WaveDivider'
import type { BSAEvent } from '@/lib/liveheats'

function Card({ event }: { event: BSAEvent }) {
  const d = new Date(event.date)
  const isUpcoming = event.status === 'upcoming'
  return (
    <Link href={`/events/${event.id}`} style={{ display: 'block', textDecoration: 'none', backgroundColor: '#fff', borderRadius: 12, padding: 24, border: '1px solid rgba(10,37,64,0.06)', transition: 'box-shadow 0.2s', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', lineHeight: 1.3, flex: 1, paddingRight: 12 }}>{event.name}</h3>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: isUpcoming ? 'rgba(43,165,160,0.1)' : 'rgba(10,37,64,0.04)', color: isUpcoming ? '#2BA5A0' : 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{isUpcoming ? 'Upcoming' : 'Completed'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(26,26,26,0.4)', fontSize: 13, marginBottom: 14 }}>
        <CalendarIcon size={14} />{d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      {event.eventDivisions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {event.eventDivisions.slice(0, 5).map(dv => (
            <span key={dv.id} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(10,37,64,0.04)', color: 'rgba(26,26,26,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dv.division.name}</span>
          ))}
          {event.eventDivisions.length > 5 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(10,37,64,0.04)', color: 'rgba(26,26,26,0.3)' }}>+{event.eventDivisions.length - 5}</span>}
        </div>
      )}
    </Link>
  )
}

export function EventsClient({ upcoming, past }: { upcoming: BSAEvent[]; past: BSAEvent[] }) {
  const years = [...new Set(past.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a)
  const [yr, setYr] = useState<number | null>(years[0] || null)
  const filtered = yr ? past.filter(e => new Date(e.date).getFullYear() === yr) : past
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero header */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Competition Calendar</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff' }}>Events</h1>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {upcoming.length > 0 && <>
            <ScrollReveal><h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540', marginBottom: 20 }}>Upcoming</h2></ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginBottom: 48 }}>
              {upcoming.map((e, i) => <ScrollReveal key={e.id} delay={i * 80}><Card event={e} /></ScrollReveal>)}
            </div>
          </>}
          <ScrollReveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540' }}>Past Events</h2>
              {years.length > 1 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {years.map(y => <button key={y} onClick={() => setYr(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: yr === y ? '#0A2540' : 'rgba(10,37,64,0.04)', color: yr === y ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s' }}>{y}</button>)}
                </div>
              )}
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((e, i) => <ScrollReveal key={e.id} delay={i * 60}><Card event={e} /></ScrollReveal>)}
          </div>
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No events found.</p>}
        </div>
      </section>
    </div>
  )
}
