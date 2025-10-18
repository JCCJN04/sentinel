'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentUploadZoneProps {
  onFileSelect: (file: File) => void
  acceptedTypes: string[]
  maxSize: number
  onFileRemove?: () => void
  selectedFile?: File | null
  filePreview?: string | null
  fileName?: string
  disabled?: boolean
  error?: string
}

export function DocumentUploadZone({
  onFileSelect,
  acceptedTypes,
  maxSize,
  onFileRemove,
  selectedFile,
  filePreview,
  fileName,
  disabled = false,
  error,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no soportado. Archivos permitidos: ${acceptedTypes.join(', ')}`,
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
      }
    }

    return { valid: true }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)

      if (validation.valid) {
        onFileSelect(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)

      if (validation.valid) {
        onFileSelect(file)
      }
    }
  }

  const handleClick = () => {
    if (!disabled && !selectedFile) {
      fileInputRef.current?.click()
    }
  }

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <Upload size={48} className="text-blue-500" />

    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'pdf':
        return <FileText size={48} className="text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText size={48} className="text-blue-600" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'heic':
      case 'heif':
        return <FileText size={48} className="text-green-500" />
      default:
        return <FileText size={48} className="text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedTypes.join(',')}
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDrag={handleDrag}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 transition-all duration-300 cursor-pointer',
            isDragging || isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg scale-[1.01]'
              : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 bg-white dark:bg-slate-900',
            error && 'border-red-500 bg-red-50 dark:bg-red-950/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className={cn(
              'mb-4 transition-transform duration-300',
              isDragActive && 'scale-110 animate-bounce'
            )}>
              {isDragActive ? (
                <Upload size={48} className="text-blue-500 animate-pulse" />
              ) : (
                <Upload size={48} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>

            <p className="text-center">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {isDragActive ? '📥 Suelta el archivo aquí' : 'Haz clic o arrastra un archivo'}
              </span>
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              PDF, DOC, DOCX, JPG, PNG, HEIC (Máx. {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full p-6 border border-green-300 dark:border-green-700 rounded-xl bg-green-50 dark:bg-green-950/20">
          {filePreview && (
            <div className="relative w-48 h-48 mx-auto mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
              <img
                src={filePreview}
                alt="Vista previa"
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              {getFileIcon(fileName)}
            </div>

            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {fileName}
              </p>
              {selectedFile && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onFileRemove}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <X size={16} />
              Cambiar archivo
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
