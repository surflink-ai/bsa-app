'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, inputStyle, selectStyle } from '@/components/admin/ui'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('news')
  const [authorName, setAuthorName] = useState('BSA')
  const [featuredImage, setFeaturedImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const save = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: e } = await supabase.from('articles').insert({
      title, slug: slug || toSlug(title), excerpt: excerpt || null, content, category,
      author_name: authorName, featured_image: featuredImage || null,
      published: publish, published_at: publish ? new Date().toISOString() : null,
    })
    if (e) { setError(e.message); setLoading(false); return }
    router.push('/admin/articles'); router.refresh()
  }

  return (
    <div>
      <PageHeader title="New Article" backHref="/admin/articles" />

      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--admin-danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Main */}
        <div>
          <Card>
            <FormField label="Title">
              <input type="text" value={title} onChange={e => { setTitle(e.target.value); setSlug(toSlug(e.target.value)) }}
                style={{ ...inputStyle, fontSize: 18, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }} placeholder="Article title..." />
            </FormField>
            <FormField label="Slug">
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </FormField>
            <FormField label="Excerpt">
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief summary..." />
            </FormField>
            <FormField label="Content">
              <ArticleEditor onChange={setContent} />
            </FormField>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <FormField label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                <option value="news">News</option>
                <option value="event-recap">Event Recap</option>
                <option value="athlete-spotlight">Athlete Spotlight</option>
                <option value="announcement">Announcement</option>
                <option value="feature">Feature</option>
              </select>
            </FormField>
            <FormField label="Author">
              <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Featured Image URL">
              <input type="url" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} style={inputStyle} placeholder="https://..." />
            </FormField>
          </Card>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button onClick={() => save(true)} disabled={loading} style={{ width: '100%' }}>Publish</Button>
              <Button variant="secondary" onClick={() => save(false)} disabled={loading} style={{ width: '100%' }}>Save Draft</Button>
              <Button variant="ghost" href="/admin/articles" style={{ width: '100%' }}>Cancel</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
