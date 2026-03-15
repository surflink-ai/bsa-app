import { Metadata } from 'next'
import { StreamClient } from './StreamClient'

export const metadata: Metadata = {
  title: 'BSA Live — Barbados Surfing Association',
  description: 'Watch live surf competitions with real-time scoring from the Barbados Surfing Association.',
}

export default function StreamPage() {
  return <StreamClient />
}
