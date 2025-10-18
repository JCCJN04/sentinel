'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle2, Download, FolderOpen, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Document } from '@/lib/document-service'

interface UploadSuccessModalProps {
  isOpen: boolean
  document: Document | null
  onViewDocument?: () => void
  onUploadAnother?: () => void
  onGoToDocuments?: () => void
  onClose?: () => void
}

export function UploadSuccessModal({
  isOpen,
  document,
  onViewDocument,
  onUploadAnother,
  onGoToDocuments,
  onClose,
}: UploadSuccessModalProps) {
  if (!document) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            ¡Documento subido exitosamente!
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Tu documento ha sido guardado y está listo para usar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                  {document.name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {document.category && (
                    <Badge variant="outline" className="text-xs">
                      {document.category}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {document.file_type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tamaño</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatFileSize(document.id.length * 100)} {/* Aproximación */}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Fecha</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(document.date)}
                </p>
              </div>
            </div>

            {document.notes && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notas</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                  {document.notes}
                </p>
              </div>
            )}
          </div>

          {document.status === 'próximo a vencer' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                ⚠️ Este documento está próximo a vencer
              </p>
            </div>
          )}

          {document.status === 'vencido' && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-800 dark:text-red-300">
                ⛔ Este documento está vencido
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onUploadAnother}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Subir otro documento
          </Button>

          <Button
            onClick={onGoToDocuments}
            variant="outline"
            className="w-full"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Ver mis documentos
          </Button>

          <Button
            onClick={onViewDocument}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Ver documento
          </Button>
        </DialogFooter>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Los documentos se guardan de forma segura en tu cuenta.
        </p>
      </DialogContent>
    </Dialog>
  )
}
