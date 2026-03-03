'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface PhotoUploaderProps {
  onUpload: (files: File[]) => void
  uploading?: boolean
}

export function PhotoUploader({ onUpload, uploading = false }: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviews = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPreviews(prev => [...prev, ...newPreviews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
  })

  const handleUpload = () => {
    onUpload(previews.map(p => p.file))
    setPreviews([])
  }

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].url)
      updated.splice(index, 1)
      return updated
    })
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${isDragActive ? '#2BA5A0' : 'rgba(10,37,64,0.1)'}`,
          borderRadius: '4px',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: isDragActive ? 'rgba(43,165,160,0.03)' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <p className="text-[13px]" style={{ color: 'rgba(10,37,64,0.35)' }}>
          {isDragActive ? 'Drop photos here...' : 'Drag and drop photos here, or click to browse'}
        </p>
        <p className="text-[10px] mt-1.5" style={{ color: 'rgba(10,37,64,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
          JPG, PNG, WebP accepted
        </p>
      </div>

      {previews.length > 0 && (
        <div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative group">
                <img
                  src={p.url}
                  alt={`Preview ${i + 1}`}
                  className="w-full aspect-square object-cover"
                  style={{ borderRadius: '3px' }}
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: '#DC2626', borderRadius: '2px' }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="mt-3 text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}
          >
            {uploading ? 'Uploading...' : `Upload ${previews.length} photo${previews.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
