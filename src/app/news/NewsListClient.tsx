'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import type { Article } from '@/lib/news'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'event-recap', label: 'Event Recaps' },
  { key: 'athlete-spotlight', label: 'Athletes' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'international', label: 'International' },
]

const categoryLabels: Record<string, string> = {
  "event-recap": "Event Recap",
  "athlete-spotlight": "Athlete Spotlight",
  "announcement": "Announcement",
  "international": "International",
}

function getCategoryLabel(c: string): string { return categoryLabels[c] || c }

export function NewsListClient({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter)

  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Latest Updates</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#0A2540', marginBottom: '2rem' }}>News</h1>
        </ScrollReveal>
        <ScrollReveal>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setFilter(c.key)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem', fontWeight: 500, padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: filter === c.key ? '#0A2540' : '#F2EDE4', color: filter === c.key ? '#fff' : 'rgba(26,26,26,0.5)' }}>{c.label}</button>
            ))}
          </div>
        </ScrollReveal>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article, i) => (
              <ScrollReveal key={article.slug} delay={i * 80}>
                <Link href={`/news/${article.slug}`} style={{ display: 'block', textDecoration: 'none', backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}>
                  {article.image && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 'clamp(1rem,2vw,1.5rem)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: 'rgba(43,165,160,0.1)', color: '#2BA5A0', textTransform: 'uppercase' }}>{getCategoryLabel(article.category)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(26,26,26,0.35)' }}>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.05rem', color: '#0A2540', marginBottom: '0.5rem', lineHeight: 1.35 }}>{article.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(26,26,26,0.5)', lineHeight: 1.6 }}>{article.excerpt}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No articles yet. Check back soon!</p>
        )}
      </div>
    </div>
  )
}
