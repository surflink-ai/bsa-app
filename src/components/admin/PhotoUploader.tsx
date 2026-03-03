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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-[#2BA5A0] bg-[#2BA5A0]/5' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-400 text-sm">
          {isDragActive ? 'Drop photos here...' : 'Drag & drop photos here, or click to browse'}
        </p>
        <p className="text-xs text-gray-300 mt-2">JPG, PNG, WebP accepted</p>
      </div>

      {previews.length > 0 && (
        <div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative group">
                <img
                  src={p.url}
                  alt={`Preview ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${previews.length} photo${previews.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
