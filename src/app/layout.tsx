import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'

export const metadata: Metadata = {
  title: 'Barbados Surfing Association — Official Website',
  description: 'The National Governing Body for Surfing in Barbados. ISA Member Federation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warm-white text-dark">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
