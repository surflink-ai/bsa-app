import { getAllArticles } from '@/lib/news'
import { NewsListClient } from './NewsListClient'
export const revalidate = 300
export default async function NewsPage() {
  const articles = await getAllArticles()
  return <NewsListClient articles={articles} />
}
