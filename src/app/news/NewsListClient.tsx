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
  "news": "News",
  "feature": "Feature",
}

export function NewsListClient({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter)
  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero — navy */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Latest Updates</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 16 }}>News</h1>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginRight: 6 }}>{articles.length}</span>articles
            </div>
            {articles.length > 0 && (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                Latest: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(articles[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured article — still navy, large card */}
      {featured && (
        <section style={{ backgroundColor: '#0A2540', padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Link href={`/news/${featured.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
                transition: 'border-color 0.2s',
              }}>
                <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: featured.featured_image ? '1fr 1fr' : '1fr', gap: 0 }}>
                  {/* Image */}
                  {featured.featured_image && (
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <img src={featured.featured_image} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  {/* Content */}
                  <div style={{ padding: 'clamp(24px,4vw,48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 20,
                        backgroundColor: 'rgba(43,165,160,0.15)', color: '#2BA5A0',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{categoryLabels[featured.category] || featured.category}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{
                      fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                      fontSize: 'clamp(1.25rem,3vw,2rem)', color: '#fff',
                      marginBottom: 12, lineHeight: 1.25,
                    }}>{featured.title}</h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 16 }}>
                      {featured.excerpt}
                    </p>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#2BA5A0', fontWeight: 600 }}>
                      Read article →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* Article grid — white */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Category filters */}
          <ScrollReveal>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 32 }}>
              {CATEGORIES.map(c => {
                const count = c.key === 'all' ? articles.length : articles.filter(a => a.category === c.key).length
                return (
                  <button key={c.key} onClick={() => setFilter(c.key)} style={{
                    fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500,
                    padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    backgroundColor: filter === c.key ? '#0A2540' : 'rgba(10,37,64,0.04)',
                    color: filter === c.key ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s',
                  }}>
                    {c.label}
                    <span style={{ marginLeft: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5 }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </ScrollReveal>

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article, i) => (
                <ScrollReveal key={article.slug} delay={i * 60}>
                  <Link href={`/news/${article.slug}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
                    <div style={{
                      backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid rgba(10,37,64,0.06)', height: '100%',
                      display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s',
                    }}>
                      {/* Article image */}
                      {article.featured_image && (
                        <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: 'rgba(10,37,64,0.03)' }}>
                          <img src={article.featured_image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        </div>
                      )}
                      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600,
                            padding: '3px 8px', borderRadius: 20,
                            backgroundColor: 'rgba(43,165,160,0.08)', color: '#2BA5A0',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>{categoryLabels[article.category] || article.category}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)' }}>
                            {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h2 style={{
                          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
                          fontSize: 16, color: '#0A2540', marginBottom: 8, lineHeight: 1.35,
                        }}>{article.title}</h2>
                        <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.5)', lineHeight: 1.6, flex: 1 }}>{article.excerpt}</p>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2BA5A0', fontWeight: 600, marginTop: 12 }}>
                          Read more →
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>
              {articles.length <= 1 ? 'More articles coming soon.' : 'No articles in this category yet.'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
