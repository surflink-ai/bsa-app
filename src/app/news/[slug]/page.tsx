import { getArticle, getCategoryLabel } from '@/lib/news'
import Link from 'next/link'
import { WaveDivider } from '../../components/WaveDivider'
export const revalidate = 300

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Article not found.</div>

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
          <div className="article-content" style={{ fontSize: 16, lineHeight: 1.9, color: 'rgba(26,26,26,0.65)', fontFamily: "'Space Grotesk',sans-serif" }} dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </section>
    </div>
  )
}
