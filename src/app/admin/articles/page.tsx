import { requireAdmin } from '@/lib/supabase/admin'
import { getAllArticlesAdmin, getCategoryLabel } from '@/lib/db/articles'
import Link from 'next/link'

export default async function AdminArticlesPage() {
  await requireAdmin()
  const articles = await getAllArticlesAdmin()

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0A2540', margin: 0 }}>
            Articles
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/articles/new" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          background: '#0A2540',
          color: '#fff',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Space Grotesk', sans-serif",
          textDecoration: 'none',
          letterSpacing: '0.01em',
          transition: 'opacity 0.15s',
        }}>
          New Article
        </Link>
      </div>

      {/* Table */}
      {articles.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#94A3B8', fontSize: 14 }}>No articles yet. Create your first one.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.08)' }}>
                {['Title', 'Category', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{
                    textAlign: h === '' ? 'right' : 'left',
                    padding: '12px 20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: '#94A3B8',
                    background: 'rgba(10,37,64,0.02)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map((article, i) => (
                <tr key={article.id} style={{
                  borderBottom: i < articles.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                  background: i % 2 === 1 ? 'rgba(10,37,64,0.015)' : 'transparent',
                }}>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0A2540' }}>{article.title}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{getCategoryLabel(article.category)}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: article.published ? '#16A34A' : '#D97706',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: article.published ? '#16A34A' : '#D97706' }} />
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#94A3B8' }}>
                      {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <Link href={`/admin/articles/${article.id}/edit`} style={{ fontSize: 12, fontWeight: 500, color: '#1478B5', textDecoration: 'none' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
