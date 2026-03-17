"use client"
import { useState, useEffect } from "react"

export function NotificationBanner() {
  const [show, setShow] = useState(false)
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setSupported(true)
      if (Notification.permission === "granted") {
        setSubscribed(true)
      } else if (Notification.permission !== "denied") {
        // Show banner after 5 seconds if not already subscribed or denied
        const timer = setTimeout(() => setShow(true), 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleSubscribe = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js")
        setSubscribed(true)
        setShow(false)
        // Show a test notification
        new Notification("BSA Notifications Enabled", {
          body: "You'll be notified about upcoming events and results!",
          icon: "/bsa-logo.webp",
        })
      } else {
        setShow(false)
      }
    } catch {
      setShow(false)
    }
  }

  if (!supported || !show || subscribed) return null

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 40,
      backgroundColor: "#0A2540", borderRadius: 12, padding: "16px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      maxWidth: 480, margin: "0 auto",
    }}>
      <div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 4 }}>Stay in the loop</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Get notified about events, results & news</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={() => setShow(false)} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>Later</button>
        <button onClick={handleSubscribe} style={{ fontSize: 12, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 6 }}>Enable</button>
      </div>
    </div>
  )
}
