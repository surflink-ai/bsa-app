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

  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Photos</h1>
        <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{photos.length} photos</p>
      </div>

      {/* Upload section */}
      <div className="mb-6 p-5" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
        <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Upload Photos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label style={labelStyle}>Event ID</label>
            <input type="text" value={eventId} onChange={e => setEventId(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
              placeholder="LiveHeats event ID" />
          </div>
          <div>
            <label style={labelStyle}>Event Name</label>
            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
              placeholder="SOTY #1 2026" />
          </div>
          <div>
            <label style={labelStyle}>Photographer Credit</label>
            <input type="text" value={credit} onChange={e => setCredit(e.target.value)}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
        </div>
        <PhotoUploader onUpload={handleUpload} uploading={uploading} />
      </div>

      {/* Photo grid */}
      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="group relative" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
              <img src={photo.src} alt={photo.alt || ''} className="w-full aspect-square object-cover" />
              <div className="px-3 py-2">
                <p className="text-[11px] text-[#0A2540]/40 truncate">{photo.event_name || photo.event_id}</p>
                {photo.credit && (
                  <p className="text-[10px] text-[#0A2540]/20 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {photo.credit}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: '#DC2626', borderRadius: '2px' }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
