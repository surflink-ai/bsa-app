import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { getLatestArticles } from '@/lib/news'
import { getStreamConfig } from '@/lib/db/stream'
import { HomeClient } from './HomeClient'
import { LiveStreamBanner } from '@/components/LiveStreamBanner'
export const revalidate = 300
export default async function Home() {
  try {
    const [org, articles, streamConfig] = await Promise.all([
      getOrg(),
      getLatestArticles(3),
      getStreamConfig().catch(() => null),
    ])
    const upcoming = getUpcomingEvents(org.events)
    const past = getPastEvents(org.events)
    let latestResults = null
    if (past.length > 0) {
      try {
        const ev = await getEvent(past[0].id)
        const cleanName = past[0].name.replace(/\s*\(SOTY\s*#\d+\s*\([^)]*\)\)/gi, '').replace(/\s*\(Nationals only\)/gi, '').trim()
        latestResults = { event: ev, eventName: cleanName, eventDate: past[0].date }
      } catch {}
    }
    return (
      <>
        {streamConfig?.active && <LiveStreamBanner title={streamConfig.title} streamUrl={streamConfig.stream_url} embedCode={streamConfig.embed_code} />}
        <HomeClient org={org} upcomingEvents={upcoming} pastEvents={past} latestResults={latestResults} latestArticles={articles} />
      </>
    )
  } catch {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(26,26,26,0.4)' }}>Unable to load data. Please try again later.</div>
  }
}
