import type { Metadata } from 'next'
import { getChampionsByYear, getYears } from '@/lib/history'
import { HistoryClient } from './HistoryClient'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'History & Champions',
  description: 'Past Barbados national surfing champions by year and division — the record of BSA competition history.',
  alternates: { canonical: '/history' },
}
export default async function HistoryPage() {
  const [championsByYear, years] = await Promise.all([getChampionsByYear(), getYears()])
  return <HistoryClient championsByYear={championsByYear} years={years} />
}
