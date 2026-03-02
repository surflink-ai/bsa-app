import { getAllArticles } from '@/lib/news'
import { NewsListClient } from './NewsListClient'
export const revalidate = 300
export default function NewsPage() {
  const articles = getAllArticles()
  return <NewsListClient articles={articles} />
}
