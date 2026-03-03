import { requireAdmin } from '@/lib/supabase/admin'
import { getAllArticlesAdmin, getCategoryLabel } from '@/lib/db/articles'
import { ArticlesClient } from './ArticlesClient'

export default async function AdminArticlesPage() {
  await requireAdmin()
  const articles = await getAllArticlesAdmin()
  return <ArticlesClient articles={articles.map(a => ({ ...a, categoryLabel: getCategoryLabel(a.category) }))} />
}
