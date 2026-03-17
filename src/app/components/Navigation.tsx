"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarIcon, UsersIcon, BarChartIcon, HomeIcon, PlayIcon } from "./Icons"

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/athletes", label: "Athletes" },
  { href: "/rankings", label: "Rankings" },
  { href: "/results", label: "Results" },
  { href: "/surf-report", label: "Surf Report" },
  { href: "/stream", label: "Live" },
  { href: "/news", label: "News" },
]

// Links that only appear in the hamburger menu (not in the dock)
const HAMBURGER_LINKS = [
  { href: "/results", label: "Results" },
  { href: "/surf-report", label: "Surf Report" },
  { href: "/news", label: "News" },
  { href: "/history", label: "History" },
  { href: "/juniors", label: "Juniors Programme" },
  { href: "/contact", label: "Contact" },
]

const HAMBURGER_SOCIAL = [
  { href: "https://www.instagram.com/barbadossurfingassociation/", label: "Instagram" },
  { href: "https://www.facebook.com/bsasurf/", label: "Facebook" },
  { href: "mailto:admin@bsa.surf", label: "Email" },
]

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const bgStyle = scrolled || !isHome ? { backgroundColor: "#0A2540" } : { backgroundColor: "transparent" }

  return (
    <>
      {/* ── Desktop top nav ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "background-color 0.3s ease", ...bgStyle }} className="hidden md:block">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/bsa-logo.webp" alt="BSA" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "0.05em" }}>BSA</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500, color: pathname.startsWith(l.href) ? "#2BA5A0" : "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 0.2s ease" }}>{l.label}</Link>
            ))}
            <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "8px 18px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register</a>
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <nav className="md:hidden" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 51,
        backgroundColor: "#0A2540",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56, padding: "0 16px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/bsa-logo.webp" alt="BSA" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>BSA</span>
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, display: "flex", flexDirection: "column",
            gap: menuOpen ? 0 : 5, alignItems: "center", justifyContent: "center",
            width: 40, height: 40, position: "relative",
          }}
          aria-label="Menu"
        >
          <span style={{
            display: "block", width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2,
            transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(45deg) translateY(0px)" : "none",
            position: menuOpen ? "absolute" : "relative",
          }} />
          <span style={{
            display: "block", width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2,
            transition: "all 0.3s ease",
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: "block", width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2,
            transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(-45deg) translateY(0px)" : "none",
            position: menuOpen ? "absolute" : "relative",
          }} />
        </button>
      </nav>

      {/* ── Mobile hamburger overlay ── */}
      <div
        className="md:hidden"
        style={{
          position: "fixed", top: 56, left: 0, right: 0, bottom: 60,
          zIndex: 50,
          backgroundColor: "#0A2540",
          transform: menuOpen ? "translateY(0)" : "translateY(-120%)",
          opacity: menuOpen ? 1 : 0,
          transition: "transform 0.3s ease, opacity 0.25s ease",
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          gap: 8,
        }}
      >
        {HAMBURGER_LINKS.map(l => {
          const active = pathname.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href} style={{
              textDecoration: "none",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: active ? "#2BA5A0" : "rgba(255,255,255,0.8)",
              padding: "10px 32px",
              borderRadius: 12,
              background: active ? "rgba(43,165,160,0.1)" : "transparent",
              transition: "all 0.2s",
              display: "block",
              textAlign: "center" as const,
            }}>
              {l.label}
            </Link>
          )
        })}

        {/* Divider */}
        <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.08)", margin: "8px auto" }} />

        {/* Social links */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {HAMBURGER_SOCIAL.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Register button */}
        <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-block",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: "#1478B5",
          padding: "12px 40px",
          borderRadius: 8,
          textDecoration: "none",
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          marginTop: 8,
          textAlign: "center" as const,
        }}>
          Register
        </a>
      </div>

      {/* ── Mobile bottom dock (unchanged) ── */}
      <nav className="md:hidden safe-area-bottom" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 52,
        backgroundColor: "#0A2540",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        height: 60,
      }}>
        {[
          { href: "/", label: "Home", Icon: HomeIcon },
          { href: "/events", label: "Events", Icon: CalendarIcon },
          { href: "/stream", label: "Live", Icon: PlayIcon },
          { href: "/athletes", label: "Athletes", Icon: UsersIcon },
          { href: "/rankings", label: "Rankings", Icon: BarChartIcon },
        ].map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none", color: active ? "#2BA5A0" : "rgba(255,255,255,0.35)", transition: "color 0.2s" }}>
              <Icon size={20} />
              <span style={{ fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, letterSpacing: "0.04em" }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
