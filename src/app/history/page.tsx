import { getChampionsByYear, getYears } from '@/lib/history'
import { HistoryClient } from './HistoryClient'
export const revalidate = 3600
export default function HistoryPage() {
  return <HistoryClient championsByYear={getChampionsByYear()} years={getYears()} />
}
