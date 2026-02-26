'use client'
import { useEffect, useRef, type ReactNode } from 'react'

export function ScrollReveal({ children, className = '', stagger = false, delay = 0 }: { children: ReactNode; className?: string; stagger?: boolean; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (delay) el.style.transitionDelay = `${delay}ms`
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return <div ref={ref} className={`reveal ${stagger ? 'stagger' : ''} ${className}`}>{children}</div>
}

export default ScrollReveal
