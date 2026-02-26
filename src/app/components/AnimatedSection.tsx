'use client'

import { ReactNode } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

export function FadeIn({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`fade-in ${visible ? 'visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}

export function StaggerContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className={`stagger-container ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`fade-in stagger-item ${className}`}>
      {children}
    </div>
  )
}

export function ScaleCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`scale-hover ${className}`}>
      {children}
    </div>
  )
}
