'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FileUploadProps {
  projectId: string
}

export function FileUpload({ projectId }: FileUploadProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      
      router.refresh()
    } catch (error) {
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {uploading ? (
        <p className="text-gray-600">Uploading...</p>
      ) : (
        <>
          <p className="text-gray-600 mb-2">Drag and drop a file here, or</p>
          <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
            browse to upload
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400 mt-2">PDF, images, documents</p>
        </>
      )}
    </div>
  )
}