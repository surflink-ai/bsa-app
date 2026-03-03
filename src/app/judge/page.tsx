import { JudgeClient } from './JudgeClient'

export const metadata = {
  title: 'BSA Judge — Scoring',
  description: 'Competition scoring interface for BSA judges',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function JudgePage() {
  return <JudgeClient />
}
