import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "./components/Navigation"
import { Footer } from "./components/Footer"
import { NotificationBanner } from "./components/NotificationBanner"

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
      <body style={{ backgroundColor: "#FAFAF8", color: "#1A1A1A" }}>
        <Navigation />
        <main style={{ paddingBottom: 80 }} className="md:pb-0">{children}</main>
        <Footer />
        <NotificationBanner />
      </body>
    </html>
  )
}
