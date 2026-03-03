import { requireAdmin } from '@/lib/supabase/admin'
import { getAllArticlesAdmin, getCategoryLabel } from '@/lib/db/articles'
import Link from 'next/link'

export default async function AdminArticlesPage() {
  await requireAdmin()
  const articles = await getAllArticlesAdmin()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-[22px] font-semibold text-[#0A2540]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Articles
          </h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {articles.length} total
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}
        >
          New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No articles yet. Create your first one.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              <th className="text-left pb-2.5 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>
                Title
              </th>
              <th className="text-left pb-2.5 pr-4 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>
                Category
              </th>
              <th className="text-left pb-2.5 pr-4 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>
                Status
              </th>
              <th className="text-left pb-2.5 pr-4 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>
                Date
              </th>
              <th className="text-right pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)', width: '80px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, i) => (
              <tr
                key={article.id}
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}
              >
                <td className="py-2.5 pr-4">
                  <p className="text-[13px] text-[#0A2540]/80 truncate max-w-[300px]">{article.title}</p>
                  <p className="text-[11px] text-[#0A2540]/25 md:hidden mt-0.5">{getCategoryLabel(article.category)}</p>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[11px] text-[#0A2540]/40">{getCategoryLabel(article.category)}</span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: article.published ? '#22C55E' : '#D1D5DB' }} />
                    <span className="text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: article.published ? '#22C55E' : '#9CA3AF' }}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[11px] text-[#0A2540]/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : new Date(article.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <Link href={`/admin/articles/${article.id}/edit`} className="text-[12px] text-[#1478B5] hover:text-[#0A2540] transition-colors">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
