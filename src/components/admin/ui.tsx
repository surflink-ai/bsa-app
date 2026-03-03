'use client'

import { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react'
import Link from 'next/link'

/* ─────────────────────────────────────────────
   PageHeader
   ───────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action, backHref }: {
  title: string
  subtitle?: string
  action?: { label: string; href?: string; onClick?: () => void }
  backHref?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
      <div>
        {backHref && (
          <Link href={backHref} style={{ fontSize: 12, color: 'var(--admin-text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}>
            &larr; Back
          </Link>
        )}
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--admin-navy)', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 6 }}>{subtitle}</p>}
      </div>
      {action && (
        action.href ? (
          <Link href={action.href} style={btnStyle('primary')}>{action.label}</Link>
        ) : (
          <button onClick={action.onClick} style={btnStyle('primary')}>{action.label}</button>
        )
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card
   ───────────────────────────────────────────── */
export function Card({ children, style, padding = true }: { children: ReactNode; style?: CSSProperties; padding?: boolean }) {
  return (
    <div style={{
      background: 'var(--admin-surface)',
      borderRadius: 'var(--admin-radius)',
      border: '1px solid var(--admin-border)',
      ...(padding ? { padding: '24px' } : {}),
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action }: { title: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--admin-border)' }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--admin-navy)' }}>{title}</span>
      {action && (
        action.href ? (
          <Link href={action.href} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-teal)', textDecoration: 'none' }}>{action.label}</Link>
        ) : (
          <button onClick={action.onClick} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{action.label}</button>
        )
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   DataTable
   ───────────────────────────────────────────── */
interface Column<T> {
  key: string
  label: string
  render: (row: T, i: number) => ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

export function DataTable<T extends { id?: string }>({ columns, rows, onRowClick }: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
}) {
  if (rows.length === 0) return <EmptyState message="No data found" />

  return (
    <Card padding={false} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {columns.map(col => (
                <th key={col.key} style={{
                  textAlign: (col.align || 'left') as 'left' | 'right' | 'center',
                  padding: '11px 20px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--admin-text-muted)',
                  background: 'rgba(10,37,64,0.018)',
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid var(--admin-border-subtle)' : 'none',
                  background: i % 2 === 1 ? 'rgba(10,37,64,0.012)' : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'rgba(10,37,64,0.03)' }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(10,37,64,0.012)' : 'transparent' }}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '13px 20px', textAlign: (col.align || 'left') as 'left' | 'right' | 'center' }}>
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   FormField
   ───────────────────────────────────────────── */
export function FormField({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, ...style }}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--admin-text-muted)',
        marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: 'var(--admin-radius)',
  fontSize: 14,
  color: 'var(--admin-text)',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
  background: '#fff',
}

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
}

/* ─────────────────────────────────────────────
   Button
   ───────────────────────────────────────────── */
function btnStyle(variant: 'primary' | 'secondary' | 'danger' | 'ghost'): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 20px',
    borderRadius: 'var(--admin-radius)',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    textDecoration: 'none',
    letterSpacing: '0.01em',
    cursor: 'pointer',
    transition: 'opacity 0.15s, background 0.15s',
    border: 'none',
    whiteSpace: 'nowrap',
  }
  if (variant === 'primary') return { ...base, background: 'var(--admin-navy)', color: '#fff' }
  if (variant === 'secondary') return { ...base, background: 'transparent', color: 'var(--admin-navy)', border: '1px solid var(--admin-border)' }
  if (variant === 'danger') return { ...base, background: 'transparent', color: 'var(--admin-danger)', padding: '10px 12px' }
  return { ...base, background: 'transparent', color: 'var(--admin-text-secondary)', padding: '10px 12px' }
}

export function Button({ variant = 'primary', children, onClick, disabled, href, type = 'button', style }: {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  href?: string
  type?: 'button' | 'submit'
  style?: CSSProperties
}) {
  const s = { ...btnStyle(variant), opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' as const : 'auto' as const, ...style }
  if (href) return <Link href={href} style={s}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} style={s}>{children}</button>
}

/* ─────────────────────────────────────────────
   StatusDot
   ───────────────────────────────────────────── */
export function StatusDot({ status, label }: { status: 'success' | 'warning' | 'danger' | 'muted'; label: string }) {
  const colors = { success: 'var(--admin-success)', warning: 'var(--admin-warning)', danger: 'var(--admin-danger)', muted: '#CBD5E1' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors[status] }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status], display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────── */
export function EmptyState({ message, action }: { message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <Card>
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, margin: 0 }}>{message}</p>
        {action && (
          <button onClick={action.onClick} style={{ marginTop: 16, ...btnStyle('secondary') }}>{action.label}</button>
        )}
      </div>
    </Card>
  )
}

/* ─────────────────────────────────────────────
   Modal
   ───────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 520 }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10,37,64,0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 'var(--admin-radius)',
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--admin-border)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--admin-border)',
        }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--admin-navy)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--admin-text-muted)', padding: '4px 8px', lineHeight: 1 }}>
            &times;
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Meta text helper
   ───────────────────────────────────────────── */
export function MetaText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--admin-text-muted)', ...style }}>{children}</span>
}

/* ─────────────────────────────────────────────
   Section label
   ───────────────────────────────────────────── */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--admin-text-muted)',
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   TextLink (for table actions)
   ───────────────────────────────────────────── */
export function TextLink({ href, onClick, children, color = 'var(--admin-blue)' }: {
  href?: string; onClick?: () => void; children: ReactNode; color?: string
}) {
  const s: CSSProperties = { fontSize: 12, fontWeight: 500, color, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: "'DM Sans', sans-serif" }
  if (href) return <Link href={href} style={s}>{children}</Link>
  return <button onClick={onClick} style={s}>{children}</button>
}

export function ActionLinks({ children }: { children: ReactNode | ReactNode[] }) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {items.filter(Boolean).map((child, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span style={{ color: 'var(--admin-border)', fontSize: 11 }}>|</span>}
          {child}
        </span>
      ))}
    </span>
  )
}
