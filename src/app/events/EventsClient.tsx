'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { ArrowRightIcon } from '../components/Icons'
import { WaveDivider } from '../components/WaveDivider'
import { CountdownTimer } from '../components/CountdownTimer'
import type { BSAEvent } from '@/lib/liveheats'

const SCHEDULE_2026 = [
  { num: 1, date: "2026-03-14", location: "Drill Hall", label: "SOTY #1" },
  { num: 2, date: "2026-04-11", location: "South Point", label: "SOTY #2" },
  { num: 3, date: "2026-05-09", location: "Long Beach", label: "SOTY #3" },
  { num: 4, date: "2026-09-26", location: "Parlour", label: "SOTY #4" },
  { num: 5, date: "2026-11-27", location: "Soup Bowl", label: "Nationals" },
]

function SeasonProgress() {
  const now = new Date()
  const completed = SCHEDULE_2026.filter(e => safeDate(e.date) < now).length
  const progress = (completed / SCHEDULE_2026.length) * 100
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>2026 Season Progress</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2BA5A0' }}>{completed}/{SCHEDULE_2026.length} events</span>
      </div>
      {/* Progress bar */}
      <div style={{ position: 'relative', height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 20 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, backgroundColor: '#2BA5A0', borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      {/* Event dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {SCHEDULE_2026.map((e, i) => {
          const isPast = safeDate(e.date) < now
          const isNext = !isPast && (i === 0 || safeDate(SCHEDULE_2026[i-1].date) < now)
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: isNext ? 14 : 10, height: isNext ? 14 : 10, borderRadius: '50%', backgroundColor: isPast ? '#2BA5A0' : isNext ? '#1478B5' : 'rgba(255,255,255,0.1)', border: isNext ? '2px solid #fff' : 'none', marginBottom: 8, transition: 'all 0.3s' }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: isNext ? 700 : 500, color: isNext ? '#fff' : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', textAlign: 'center' }}>{e.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: isPast ? '#2BA5A0' : isNext ? '#fff' : 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center', fontWeight: 600 }}>{safeDate(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: isPast ? 'rgba(43,165,160,0.7)' : isNext ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', marginTop: 2, textAlign: 'center' }}>{e.location}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Safe date parser — handles "2026-03-14", "2026-03-14T00:00:00Z", etc without timezone shift
function safeDate(dateStr: string): Date {
  // If it's a date-only string (YYYY-MM-DD), append noon to avoid timezone day shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00')
  }
  return new Date(dateStr)
}

export function EventsClient({ upcoming, past }: { upcoming: BSAEvent[]; past: BSAEvent[] }) {
  const years = [...new Set(past.map(e => safeDate(e.date).getFullYear()))].sort((a, b) => b - a)
  const [yr, setYr] = useState<number | null>(years[0] || null)
  const filtered = yr ? past.filter(e => safeDate(e.date).getFullYear() === yr) : past
  const nextEvent = upcoming[0]

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero with season progress */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>SOTY Championship 2026</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 32 }}>Events</h1>
          <SeasonProgress />
        </div>
      </section>

      {/* Next event card */}
      {nextEvent && (
        <section style={{ backgroundColor: '#0A2540', padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 'clamp(24px,4vw,40px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Next Up</div>
                  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.25rem,3vw,2rem)', color: '#fff', marginBottom: 8 }}>{nextEvent.name.replace(/\s*\(SOTY\s*#\d+\s*\([^)]*\)\)/gi, '').replace(/\s*\(Nationals only\)/gi, '').trim()}</h2>
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{safeDate(nextEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  {nextEvent.eventDivisions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
                      {nextEvent.eventDivisions.map(d => (
                        <span key={d.id} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{d.division.name}</span>
                      ))}
                    </div>
                  )}
                  <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#1478B5', padding: '10px 20px', borderRadius: 6, textDecoration: 'none' }}>Register <ArrowRightIcon size={14} /></a>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <CountdownTimer targetDate={nextEvent.date} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* Past events */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, color: '#0A2540' }}>Past Events</h2>
              {years.length > 1 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {years.map(y => (
                    <button key={y} onClick={() => setYr(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: yr === y ? 700 : 500, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: yr === y ? '#0A2540' : 'rgba(10,37,64,0.04)', color: yr === y ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s' }}>{y}</button>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((event, i) => {
              const d = safeDate(event.date)
              const divCount = event.eventDivisions.length
              return (
                <ScrollReveal key={event.id} delay={i * 50}>
                  <Link href={`/events/${event.id}`} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 16, alignItems: 'center', padding: '16px 20px', borderRadius: 10, border: '1px solid rgba(10,37,64,0.06)', textDecoration: 'none', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }} className="grid-responsive-event">
                    {/* Date block */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: '#0A2540', lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.2)' }}>{d.getFullYear()}</div>
                    </div>
                    {/* Event info */}
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: '#0A2540', marginBottom: 4 }}>{event.name.replace(/\s*\(SOTY\s*#\d+\s*\([^)]*\)\)/gi, '').replace(/\s*\(Nationals only\)/gi, '').trim()}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.35)' }}>{divCount} division{divCount !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(20,120,181,0.08)', color: '#1478B5', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em' }}>Results</span>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div style={{ color: 'rgba(26,26,26,0.15)' }}><ArrowRightIcon size={16} /></div>
                  </Link>
                </ScrollReveal>
              )
            })}
          </div>
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No events found.</p>}
        </div>
      </section>
    </div>
  )
}
