import { getOrg } from '@/lib/liveheats'
import { RankingsClient } from './RankingsClient'

export default async function RankingsPage() {
  const org = await getOrg()
  return <RankingsClient series={org.series} />
}
