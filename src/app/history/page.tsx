import { getChampionsByYear, getYears } from '@/lib/history'
import { HistoryClient } from './HistoryClient'
export const revalidate = 3600
export default async function HistoryPage() {
  const [championsByYear, years] = await Promise.all([getChampionsByYear(), getYears()])
  return <HistoryClient championsByYear={championsByYear} years={years} />
}
