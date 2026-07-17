import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/news'
import { NewsListClient } from './NewsListClient'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'News',
  description: 'BSA announcements, event recaps, and athlete features from the Barbados surf community.',
  alternates: { canonical: '/news' },
}
export default async function NewsPage() {
  const articles = await getAllArticles()
  return <NewsListClient articles={articles} />
}
