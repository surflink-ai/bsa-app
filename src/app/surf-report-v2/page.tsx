import { Metadata } from 'next'
import SurfMapClient from './SurfMapClient'

export const metadata: Metadata = {
  title: 'Surf Report — Barbados Surfing Association',
  description: '3D interactive surf map of Barbados with real-time conditions across all 21 surf spots.',
}

export default function SurfReportV2Page() {
  return <SurfMapClient />
}
