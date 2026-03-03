'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>New Article</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm mb-4">{error}</div>
      )}

      <div className="space-y-4 max-w-4xl">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Title</label>
          <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-lg font-semibold focus:outline-none focus:border-[#2BA5A0]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            placeholder="Article title..." />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Slug</label>
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#2BA5A0]" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Excerpt</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
            placeholder="Brief summary..." />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]">
              <option value="news">News</option>
              <option value="event-recap">Event Recap</option>
              <option value="athlete-spotlight">Athlete Spotlight</option>
              <option value="announcement">Announcement</option>
              <option value="feature">Feature</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Author</label>
            <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Featured Image URL</label>
            <input type="url" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
              placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Content</label>
          <ArticleEditor onChange={setContent} />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={() => handleSave(true)} disabled={loading}
            className="bg-[#2BA5A0] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
            {loading ? 'Saving...' : 'Publish'}
          </button>
          <button onClick={() => handleSave(false)} disabled={loading}
            className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => router.push('/admin/articles')}
            className="text-gray-400 hover:text-gray-600 px-4 py-2.5 text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
