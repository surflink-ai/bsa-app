'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const inputStyle = {
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: '4px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#0A2540',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  color: 'rgba(10,37,64,0.35)',
  display: 'block',
  marginBottom: '6px',
}

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('news')
  const [authorName, setAuthorName] = useState('BSA')
  const [featuredImage, setFeaturedImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTitleChange = (val: string) => {
    setTitle(val)
    setSlug(generateSlug(val))
  }

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('articles').insert({
      title,
      slug: slug || generateSlug(title),
      excerpt: excerpt || null,
      content,
      category,
      author_name: authorName,
      featured_image: featuredImage || null,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    router.push('/admin/articles')
    router.refresh()
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#2BA5A0'
  }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'rgba(10,37,64,0.12)'
  }

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[22px] font-semibold text-[#0A2540]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          New Article
        </h1>
      </div>

      {error && (
        <div className="mb-5 text-[13px]" style={{ color: '#DC2626', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="max-w-[800px] space-y-5">
        <div>
          <label style={labelStyle}>Title</label>
          <input
            type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
            style={{ ...inputStyle, fontSize: '16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            onFocus={focusHandler} onBlur={blurHandler}
            placeholder="Article title..."
          />
        </div>

        <div>
          <label style={labelStyle}>Slug</label>
          <input
            type="text" value={slug} onChange={e => setSlug(e.target.value)}
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
            onFocus={focusHandler} onBlur={blurHandler}
          />
        </div>

        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea
            value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
            onFocus={focusHandler} onBlur={blurHandler}
            placeholder="Brief summary..."
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
              <option value="news">News</option>
              <option value="event-recap">Event Recap</option>
              <option value="athlete-spotlight">Athlete Spotlight</option>
              <option value="announcement">Announcement</option>
              <option value="feature">Feature</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Author</label>
            <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>Featured Image URL</label>
            <input type="url" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
              placeholder="https://..." />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Content</label>
          <ArticleEditor onChange={setContent} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => handleSave(true)} disabled={loading}
            className="text-[13px] font-medium text-white px-5 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
            {loading ? 'Saving...' : 'Publish'}
          </button>
          <button onClick={() => handleSave(false)} disabled={loading}
            className="text-[13px] font-medium px-5 py-2.5 transition-colors hover:bg-[#0A2540]/[0.04] disabled:opacity-50"
            style={{ border: '1px solid rgba(10,37,64,0.12)', borderRadius: '4px', color: '#0A2540' }}>
            Save Draft
          </button>
          <button onClick={() => router.push('/admin/articles')}
            className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2.5 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
