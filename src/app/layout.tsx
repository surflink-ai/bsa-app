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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0A2540" />
      </head>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "#FAFAF8", color: "#1A1A1A", fontFamily: "'DM Sans', sans-serif" }}>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
