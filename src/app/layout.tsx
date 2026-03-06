import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "./components/Navigation"
import { Footer } from "./components/Footer"
import { NotificationBanner } from "./components/NotificationBanner"
import { PublicShell } from "./components/PublicShell"

export const metadata: Metadata = {
  title: "Barbados Surfing Association",
  description: "The National Governing Body for Surfing in Barbados. ISA Member Federation.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: "#0A2540", color: "#1A1A1A" }}>
        <PublicShell>
          <Navigation />
        </PublicShell>
        <main className="pb-20 md:pb-0">{children}</main>
        <PublicShell>
          <Footer />
          <NotificationBanner />
        </PublicShell>
      </body>
    </html>
  )
}
