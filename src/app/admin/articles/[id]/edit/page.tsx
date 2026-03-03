'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, inputStyle, selectStyle } from '@/components/admin/ui'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('news')
  const [authorName, setAuthorName] = useState('BSA')
  const [featuredImage, setFeaturedImage] = useState('')
  const [published, setPublished] = useState(false)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from('articles').select('*').eq('id', id).single()
      if (!data) { setError('Article not found'); setFetching(false); return }
      setTitle(data.title); setSlug(data.slug); setExcerpt(data.excerpt || ''); setContent(data.content)
      setCategory(data.category); setAuthorName(data.author_name); setFeaturedImage(data.featured_image || '')
      setPublished(data.published); setPublishedAt(data.published_at); setFetching(false)
    })()
  }, [id])

  const save = async (pub: boolean) => {
    if (!title.trim() || !content.trim()) { setError('Title and content required.'); return }
    setLoading(true); setError('')
    const { error: e } = await createClient().from('articles').update({
      title, slug: slug || toSlug(title), excerpt: excerpt || null, content, category,
      author_name: authorName, featured_image: featuredImage || null, published: pub,
      published_at: pub && !publishedAt ? new Date().toISOString() : publishedAt,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (e) { setError(e.message); setLoading(false); return }
    router.push('/admin/articles'); router.refresh()
  }

  const del = async () => {
    if (!confirm('Delete this article? Cannot be undone.')) return
    await createClient().from('articles').delete().eq('id', id)
    router.push('/admin/articles'); router.refresh()
  }

  if (fetching) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>
  if (error && !title) return <div style={{ padding: 40, color: 'var(--admin-danger)', fontSize: 13 }}>{error}</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <PageHeader title="Edit Article" backHref="/admin/articles" />
        <Button variant="danger" onClick={del}>Delete Article</Button>
      </div>

      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--admin-danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <Card>
          <FormField label="Title">
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); if (!slug) setSlug(toSlug(e.target.value)) }}
              style={{ ...inputStyle, fontSize: 18, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }} />
          </FormField>
          <FormField label="Slug">
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
          </FormField>
          <FormField label="Excerpt">
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>
          <FormField label="Content">
            <ArticleEditor initialContent={content} onChange={setContent} />
          </FormField>
        </Card>

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
              <Button onClick={() => save(true)} disabled={loading} style={{ width: '100%' }}>{loading ? 'Saving...' : published ? 'Update' : 'Publish'}</Button>
              <Button variant="secondary" onClick={() => save(false)} disabled={loading} style={{ width: '100%' }}>Save as Draft</Button>
              <Button variant="ghost" href="/admin/articles" style={{ width: '100%' }}>Cancel</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
