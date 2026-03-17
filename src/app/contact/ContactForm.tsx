'use client'
import { useState } from 'react'

const categories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'compete', label: 'Competition / Registration' },
  { value: 'sponsor', label: 'Sponsorship' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'membership', label: 'Membership' },
  { value: 'media', label: 'Media / Press' },
  { value: 'juniors', label: 'Junior Programme' },
]

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', category: 'general' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', subject: '', message: '', category: 'general' })
      } else setStatus('error')
    } catch { setStatus('error') }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  }

  if (status === 'sent') {
    return (
      <div style={{ padding: '40px', borderRadius: 12, textAlign: 'center', backgroundColor: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.2)' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Message Sent</div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Thanks for reaching out. We'll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>Email *</label>
          <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>Subject</label>
          <input style={inputStyle} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>Category</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>Message *</label>
        <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
      </div>

      {status === 'error' && (
        <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.06)', color: '#EF4444', fontSize: 12 }}>Failed to send. Please try again or email admin@bsa.surf directly.</div>
      )}

      <button type="submit" disabled={status === 'sending'} style={{
        padding: '14px 28px', borderRadius: 8, border: 'none',
        backgroundColor: '#1478B5', color: '#fff', fontSize: 14, fontWeight: 600,
        cursor: status === 'sending' ? 'wait' : 'pointer', opacity: status === 'sending' ? 0.7 : 1,
        fontFamily: "'Space Grotesk', sans-serif", alignSelf: 'flex-start',
      }}>
        {status === 'sending' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
