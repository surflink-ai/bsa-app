import { Metadata } from 'next'
import SurfReportClient from './SurfReportClient'

export const metadata: Metadata = {
  title: 'Surf Report — Barbados Surfing Association',
  description: 'Current surf conditions across all 21 Barbados surf spots. Wave heights, wind, and conditions updated every 15 minutes.',
}

export default function SurfReportPage() {
  return <SurfReportClient />
}
