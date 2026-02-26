"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarIcon, UsersIcon, BarChartIcon, HomeIcon } from "./Icons"

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/athletes", label: "Athletes" },
  { href: "/rankings", label: "Rankings" },
]

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const bgStyle = scrolled || !isHome ? { backgroundColor: "#0A2540" } : { backgroundColor: "transparent" }
  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "background-color 0.3s ease", ...bgStyle }} className="hidden md:block">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "0.05em" }}>BSA</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: pathname === l.href ? "#2BA5A0" : "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 0.2s ease" }}>{l.label}</Link>
            ))}
            <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "8px 20px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register</a>
          </div>
        </div>
      </nav>
      <nav className="md:hidden safe-area-bottom" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "#0A2540", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", height: 64 }}>
        {[
          { href: "/", label: "Home", Icon: HomeIcon },
          { href: "/events", label: "Events", Icon: CalendarIcon },
          { href: "/athletes", label: "Athletes", Icon: UsersIcon },
          { href: "/rankings", label: "Rankings", Icon: BarChartIcon },
        ].map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: active ? "#2BA5A0" : "rgba(255,255,255,0.45)", transition: "color 0.2s ease" }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
