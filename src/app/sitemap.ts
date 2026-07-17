import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { getAllArticles } from '@/lib/news'
import { getOrg, getPastEvents } from '@/lib/liveheats'

export const revalidate = 3600

const STATIC_ROUTES = [
  '', '/athletes', '/events', '/rankings', '/results', '/news',
  '/history', '/surf-report', '/stream', '/juniors', '/contact', '/docs',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  // News articles
  try {
    const articles = await getAllArticles()
    for (const a of articles) {
      entries.push({
        url: `${SITE_URL}/news/${a.slug}`,
        lastModified: a.date ? new Date(a.date) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch {
    /* skip on failure — never break the sitemap */
  }

  // Past events with published results
  try {
    const org = await getOrg()
    for (const e of getPastEvents(org.events)) {
      entries.push({
        url: `${SITE_URL}/events/${e.id}`,
        lastModified: e.date ? new Date(e.date) : now,
        changeFrequency: 'yearly',
        priority: 0.5,
      })
    }
  } catch {
    /* skip on failure */
  }

  return entries
}
