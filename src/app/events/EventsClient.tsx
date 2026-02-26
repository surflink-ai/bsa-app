'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { CalendarIcon } from '../components/Icons'
import type { BSAEvent } from '@/lib/liveheats'

function Card({ event }: { event: BSAEvent }) {
  const d = new Date(event.date)
  return (
    <Link href={`/events/${event.id}`} style={{ display: 'block', textDecoration: 'none', backgroundColor: '#fff', borderRadius: '1rem', padding: 'clamp(1.25rem,3vw,1.75rem)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.3s, transform 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#0A2540' }}>{event.name}</h3>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '999px', backgroundColor: event.status === 'upcoming' ? 'rgba(43,165,160,0.1)' : 'rgba(26,26,26,0.05)', color: event.status === 'upcoming' ? '#2BA5A0' : 'rgba(26,26,26,0.4)', textTransform: 'uppercase' }}>{event.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(26,26,26,0.4)', fontSize: '0.85rem', marginBottom: '0.75rem' }}><CalendarIcon size={14} />{d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      {event.eventDivisions.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{event.eventDivisions.slice(0,5).map(dv => <span key={dv.id} style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: '#F2EDE4', color: 'rgba(26,26,26,0.5)' }}>{dv.division.name}</span>)}{event.eventDivisions.length > 5 && <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: '#F2EDE4', color: 'rgba(26,26,26,0.35)' }}>+{event.eventDivisions.length - 5}</span>}</div>}
    </Link>
  )
}

export function EventsClient({ upcoming, past }: { upcoming: BSAEvent[]; past: BSAEvent[] }) {
  const years = [...new Set(past.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a)
  const [yr, setYr] = useState<number | null>(years[0] || null)
  const filtered = yr ? past.filter(e => new Date(e.date).getFullYear() === yr) : past
  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal><p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Competition Calendar</p><h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#0A2540', marginBottom: '3rem' }}>Events</h1></ScrollReveal>
        {upcoming.length > 0 && <><ScrollReveal><h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#0A2540', marginBottom: '1.5rem' }}>Upcoming</h2></ScrollReveal><div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '3rem' }}>{upcoming.map((e, i) => <ScrollReveal key={e.id} delay={i * 80}><Card event={e} /></ScrollReveal>)}</div></>}
        <ScrollReveal><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}><h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#0A2540' }}>Past Events</h2>{years.length > 1 && <div style={{ display: 'flex', gap: '0.35rem' }}>{years.map(y => <button key={y} onClick={() => setYr(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: yr === y ? '#0A2540' : 'transparent', color: yr === y ? '#fff' : 'rgba(26,26,26,0.4)' }}>{y}</button>)}</div>}</div></ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map((e, i) => <ScrollReveal key={e.id} delay={i * 60}><Card event={e} /></ScrollReveal>)}</div>
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No events found.</p>}
      </div>
    </div>
  )
}
