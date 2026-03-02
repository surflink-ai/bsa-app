'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { Article } from '@/lib/news'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'event-recap', label: 'Event Recaps' },
  { key: 'athlete-spotlight', label: 'Athletes' },
  { key: 'announcement', label: 'Announcements' },
]

const categoryLabels: Record<string, string> = {
  "event-recap": "Event Recap",
  "athlete-spotlight": "Athlete Spotlight",
  "announcement": "Announcement",
}

export function NewsListClient({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter)

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Latest Updates</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff' }}>News</h1>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Category filters */}
          <ScrollReveal>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 32 }}>
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setFilter(c.key)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: filter === c.key ? '#0A2540' : 'rgba(10,37,64,0.04)', color: filter === c.key ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s' }}>{c.label}</button>
              ))}
            </div>
          </ScrollReveal>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article, i) => (
                <ScrollReveal key={article.slug} delay={i * 80}>
                  <Link href={`/news/${article.slug}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, border: '1px solid rgba(10,37,64,0.06)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(43,165,160,0.1)', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{categoryLabels[article.category] || article.category}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)' }}>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: '#0A2540', marginBottom: 8, lineHeight: 1.35 }}>{article.title}</h2>
                      <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)', lineHeight: 1.6, flex: 1 }}>{article.excerpt}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No articles in this category yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
