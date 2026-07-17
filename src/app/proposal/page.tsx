import type { Metadata } from 'next'
import ProposalClient from './ProposalClient'

export const metadata: Metadata = {
  title: 'Proposal',
  robots: { index: false, follow: false },
}

export default function ProposalPage() {
  return <ProposalClient />
}