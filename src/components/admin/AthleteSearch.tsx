'use client'

import { useState, useRef, useEffect, CSSProperties } from 'react'

interface Athlete {
  id: string
  name: string
  image_url: string | null
  nationality: string | null
  gender: string | null
}

interface AthleteSearchProps {
  onSelect: (athlete: Athlete) => void
  onCreateNew?: (name: string) => void
  placeholder?: string
  autoFocus?: boolean
  value?: string
  onChange?: (value: string) => void
}

export function AthleteSearch({ onSelect, onCreateNew, placeholder = 'Search athlete...', autoFocus = false, value, onChange }: AthleteSearchProps) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Sync external value
  useEffect(() => {
    if (value !== undefined) setQuery(value)
  }, [value])

  const search = async (q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/athletes/search?q=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setOpen(true)
      setActiveIndex(-1)
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  const handleChange = (val: string) => {
    setQuery(val)
    onChange?.(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 200)
  }

  const handleSelect = (athlete: Athlete) => {
    setQuery(athlete.name)
    onChange?.(athlete.name)
    setOpen(false)
    onSelect(athlete)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + (onCreateNew && query.length > 1 && !results.find(r => r.name.toLowerCase() === query.toLowerCase()) ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex])
      } else if (activeIndex === results.length && onCreateNew) {
        onCreateNew(query)
        setOpen(false)
      } else if (results.length === 1) {
        handleSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showCreateNew = onCreateNew && query.length > 1 && !results.find(r => r.name.toLowerCase() === query.toLowerCase())

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0 || query.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={inputStyle}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--admin-text-muted)' }}>
            ...
          </span>
        )}
      </div>

      {open && (results.length > 0 || showCreateNew) && (
        <div style={dropdownStyle}>
          {results.map((athlete, i) => (
            <div
              key={athlete.id}
              onClick={() => handleSelect(athlete)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                ...itemStyle,
                background: activeIndex === i ? 'rgba(10,37,64,0.04)' : 'transparent',
              }}
            >
              {/* Avatar */}
              <div style={avatarStyle}>
                {athlete.image_url ? (
                  <img src={athlete.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(10,37,64,0.3)' }}>
                    {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {highlightMatch(athlete.name, query)}
                </div>
                {athlete.nationality && (
                  <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {athlete.nationality}
                  </div>
                )}
              </div>
            </div>
          ))}

          {showCreateNew && (
            <div
              onClick={() => { onCreateNew!(query); setOpen(false) }}
              onMouseEnter={() => setActiveIndex(results.length)}
              style={{
                ...itemStyle,
                background: activeIndex === results.length ? 'rgba(10,37,64,0.04)' : 'transparent',
                borderTop: results.length > 0 ? '1px solid var(--admin-border-subtle)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--admin-teal)', marginRight: 8, fontWeight: 600 }}>+</span>
              <span style={{ fontSize: 13, color: 'var(--admin-teal)', fontWeight: 500 }}>
                Add &ldquo;{query}&rdquo; as new athlete
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function highlightMatch(name: string, query: string) {
  if (!query) return name
  const idx = name.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return name
  return (
    <>
      {name.slice(0, idx)}
      <strong style={{ fontWeight: 700 }}>{name.slice(idx, idx + query.length)}</strong>
      {name.slice(idx + query.length)}
    </>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: 'var(--admin-radius, 8px)',
  fontSize: 14,
  color: 'var(--admin-text)',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  background: '#fff',
}

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: 4,
  background: '#fff',
  borderRadius: 'var(--admin-radius, 8px)',
  border: '1px solid var(--admin-border, rgba(10,37,64,0.08))',
  boxShadow: '0 8px 24px rgba(10,37,64,0.08)',
  zIndex: 50,
  maxHeight: 320,
  overflowY: 'auto',
}

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  transition: 'background 0.1s',
}

const avatarStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: 'rgba(10,37,64,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
}
