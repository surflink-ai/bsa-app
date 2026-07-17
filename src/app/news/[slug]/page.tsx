import type { Metadata } from 'next'
import { getArticle, getCategoryLabel } from '@/lib/news'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WaveDivider } from '../../components/WaveDivider'
import { sanitizeHtml } from '@/lib/sanitize'
import { SITE_URL } from '@/lib/site'
export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Article' }
  const images = article.featured_image ? [article.featured_image] : undefined
  return {
    title: article.title,
    description: article.excerpt || `${article.title} — Barbados Surfing Association news.`,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      url: `/news/${slug}`,
      type: 'article',
      publishedTime: article.date,
      images,
    },
    twitter: { card: 'summary_large_image', title: article.title, images },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.date,
    author: { '@type': 'Organization', name: article.author || 'BSA' },
    image: article.featured_image ? [article.featured_image] : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Barbados Surfing Association',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/bsa-logo.webp` },
    },
    mainEntityOfPage: `${SITE_URL}/news/${slug}`,
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/news" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 20, display: 'inline-block', letterSpacing: '0.08em' }}>← NEWS</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(43,165,160,0.2)', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{getCategoryLabel(article.category)}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(article.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: '#fff', lineHeight: 1.2 }}>{article.title}</h1>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)', marginBottom: 32 }}>By {article.author}</p>
          <div className="article-content" style={{ fontSize: 16, lineHeight: 1.9, color: 'rgba(26,26,26,0.65)', fontFamily: "'Space Grotesk',sans-serif" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </div>
  )
}
