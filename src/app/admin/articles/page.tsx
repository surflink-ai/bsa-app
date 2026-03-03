import { requireAdmin } from '@/lib/supabase/admin'
import { getAllArticlesAdmin, getCategoryLabel } from '@/lib/db/articles'
import Link from 'next/link'

export default async function AdminArticlesPage() {
  await requireAdmin()
  const articles = await getAllArticlesAdmin()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Articles</h1>
          <p className="text-sm text-gray-400 mt-1">{articles.length} total articles</p>
        </div>
        <Link href="/admin/articles/new"
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No articles yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Title</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Category</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Date</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 line-clamp-1">{article.title}</p>
                    <p className="text-xs text-gray-400 md:hidden mt-0.5">{getCategoryLabel(article.category)}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{getCategoryLabel(article.category)}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      article.published ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : new Date(article.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/articles/${article.id}/edit`} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">
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
