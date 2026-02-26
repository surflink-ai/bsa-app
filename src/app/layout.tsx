import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BSA Surf — Barbados Surfing Association',
  description: 'Official home of the Barbados Surfing Association. Live scores, athlete profiles, event results, and rankings.',
  openGraph: {
    title: 'BSA Surf — Barbados Surfing Association',
    description: 'Live scores, athlete profiles, event results, and rankings.',
    siteName: 'BSA Surf',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A2540',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <main className="min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}

function BottomNav() {
  const tabs = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Events', href: '/events', icon: '🏆' },
    { label: 'Athletes', href: '/athletes', icon: '🏄' },
    { label: 'Rankings', href: '/rankings', icon: '📊' },
    { label: 'Live', href: '/live', icon: '🔴' },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-navy/95 backdrop-blur-lg border-t border-white/10 z-50 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors px-3 py-1"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
