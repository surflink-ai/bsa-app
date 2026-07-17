import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "./components/Navigation"
import { Footer } from "./components/Footer"
import { PublicShell } from "./components/PublicShell"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Barbados Surfing Association",
    template: "%s | Barbados Surfing Association",
  },
  description: "The National Governing Body for Surfing in Barbados. ISA Member Federation.",
  applicationName: "BSA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Barbados Surfing Association",
    description: "The National Governing Body for Surfing in Barbados. ISA Member Federation since 1995. Competition results, surf reports, athlete profiles.",
    url: SITE_URL,
    siteName: "BSA",
    images: [{ url: "/bsa-logo.webp", width: 400, height: 400 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Barbados Surfing Association",
    description: "The National Governing Body for Surfing in Barbados. Competition results, surf reports, athlete profiles.",
    images: ["/bsa-logo.webp"],
  },
  robots: { index: true, follow: true },
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: "Barbados Surfing Association",
  alternateName: "BSA",
  url: SITE_URL,
  logo: `${SITE_URL}/bsa-logo.webp`,
  sport: "Surfing",
  memberOf: { "@type": "SportsOrganization", name: "International Surfing Association" },
  areaServed: { "@type": "Country", name: "Barbados" },
  sameAs: [
    "https://www.facebook.com/bsasurf",
    "https://www.instagram.com/barbadossurfingassociation",
    "https://liveheats.com/BarbadosSurfingAssociation",
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body style={{ backgroundColor: "#0A2540", color: "#1A1A1A" }}>
        <PublicShell>
          <Navigation />
        </PublicShell>
        <main className="pb-20 md:pb-0">{children}</main>
        <PublicShell>
          <Footer />
        </PublicShell>
      </body>
    </html>
  )
}
