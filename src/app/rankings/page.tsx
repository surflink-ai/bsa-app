import { getOrg } from '@/lib/liveheats'
import { RankingsClient } from './RankingsClient'
export const revalidate = 300
export default async function RankingsPage() {
  try { const org = await getOrg(); return <RankingsClient series={org.series} /> }
  catch { return <RankingsClient series={[]} /> }
}
