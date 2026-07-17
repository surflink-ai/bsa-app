import { Metadata } from 'next'
import SurfReportClient from './SurfReportClient'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Surf Report',
  description: 'Current surf conditions across all 21 Barbados surf spots. Wave heights, wind, and conditions updated every 15 minutes.',
  alternates: { canonical: '/surf-report' },
}

// Revalidate the server-rendered snapshot every 15 min (matches the cache TTL).
export const revalidate = 900

async function getInitialConditions() {
  try {
    const res = await fetch(`${SITE_URL}/api/conditions`, { next: { revalidate: 900 } })
    if (!res.ok) return undefined
    return await res.json()
  } catch {
    return undefined
  }
}

export default async function SurfReportPage() {
  const initialData = await getInitialConditions()
  return <SurfReportClient initialData={initialData} />
}
