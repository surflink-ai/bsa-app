import { getArticle, getCategoryLabel } from '@/lib/news'
import Link from 'next/link'
export const revalidate = 300

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Article not found.</div>

  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <Link href="/news" style={{ fontSize: '0.8rem', color: 'rgba(26,26,26,0.4)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>&larr; Back to News</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: 'rgba(43,165,160,0.1)', color: '#2BA5A0', textTransform: 'uppercase' }}>{getCategoryLabel(article.category)}</span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(26,26,26,0.4)' }}>{new Date(article.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.5rem)', color: '#0A2540', marginBottom: '0.5rem', lineHeight: 1.2 }}>{article.title}</h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(26,26,26,0.4)', marginBottom: '2rem' }}>By {article.author}</p>
        {article.image && <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: '2rem' }}><img src={article.image} alt={article.title} style={{ width: '100%', height: 'auto' }} /></div>}
        <div style={{ fontSize: '1rem', lineHeight: 1.9, color: 'rgba(26,26,26,0.65)' }} dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </div>
  )
}
