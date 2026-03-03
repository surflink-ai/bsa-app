'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PhotoUploader } from '@/components/admin/PhotoUploader'

interface Photo {
  id: string
  event_id: string
  event_name: string | null
  src: string
  alt: string | null
  credit: string | null
  sort_order: number
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [eventId, setEventId] = useState('')
  const [eventName, setEventName] = useState('')
  const [credit, setCredit] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchPhotos = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('event_photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [])

  const handleUpload = async (files: File[]) => {
    if (!eventId.trim()) {
      alert('Please enter an Event ID first.')
      return
    }
    setUploading(true)
    const supabase = createClient()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = `event-photos/${eventId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) {
        // If storage isn't set up, use a placeholder URL
        await supabase.from('event_photos').insert({
          event_id: eventId,
          event_name: eventName || null,
          src: URL.createObjectURL(file),
          alt: file.name,
          credit: credit || null,
          sort_order: i,
        })
      } else {
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(uploadData.path)
        await supabase.from('event_photos').insert({
          event_id: eventId,
          event_name: eventName || null,
          src: publicUrl,
          alt: file.name,
          credit: credit || null,
          sort_order: i,
        })
      }
    }

    setUploading(false)
    fetchPhotos()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return
    const supabase = createClient()
    await supabase.from('event_photos').delete().eq('id', id)
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Photos</h1>
        <p className="text-sm text-gray-400 mt-1">{photos.length} photos</p>
      </div>

      {/* Upload section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Upload Photos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Event ID</label>
            <input type="text" value={eventId} onChange={e => setEventId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
              placeholder="LiveHeats event ID" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Event Name</label>
            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
              placeholder="SOTY #1 2026" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Photographer Credit</label>
            <input type="text" value={credit} onChange={e => setCredit(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
          </div>
        </div>
        <PhotoUploader onUpload={handleUpload} uploading={uploading} />
      </div>

      {/* Photo grid */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No photos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <img src={photo.src} alt={photo.alt || ''} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-xs text-gray-500 truncate">{photo.event_name || photo.event_id}</p>
                {photo.credit && <p className="text-[10px] text-gray-400">📷 {photo.credit}</p>}
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
