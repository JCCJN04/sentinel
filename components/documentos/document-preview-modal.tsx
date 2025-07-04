'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabaseBrowserClient as supabase } from "@/lib/supabase"

interface Document {
  name: string
  file_path: string // Usaremos file_path para generar la URL segura
  file_type: string
}

interface DocumentPreviewModalProps {
  document: Document | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function DocumentPreviewModal({ document, isOpen, onOpenChange }: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Función para generar la URL segura cuando se abre el modal
    const generateUrl = async () => {
      if (isOpen && document?.file_path) {
        setLoadingUrl(true)
        setError(null)
        try {
          const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.file_path, 300) // URL segura válida por 5 minutos

          if (error) throw error
          setSignedUrl(data.signedUrl)
        } catch (err) {
          console.error("Error generating preview signed URL:", err)
          setError("No se pudo cargar la previsualización del documento.")
        } finally {
          setLoadingUrl(false)
        }
      }
    }

    generateUrl()

    // Limpia la URL cuando el diálogo se cierra para forzar la regeneración la próxima vez
    if (!isOpen) {
      setSignedUrl(null)
    }
  }, [isOpen, document])

  if (!document) {
    return null
  }

  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif'].includes(document.file_type?.toLowerCase())
  const isPdf = document.file_type?.toLowerCase() === 'pdf'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{document.name}</DialogTitle>
          <DialogDescription>
            Previsualización del documento.{" "}
            {signedUrl && 
                <a href={signedUrl} download={document.name} className="text-primary hover:underline">Descargar</a>
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 my-4 bg-muted/30 dark:bg-muted/20 rounded-lg flex items-center justify-center overflow-auto p-2">
          {loadingUrl && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {error && 
            <div className="text-destructive text-center p-4">
                <AlertCircle className="mx-auto h-8 w-8 mb-2"/>
                <p>{error}</p>
            </div>
          }
          
          {signedUrl && !loadingUrl && !error && (
            isPdf ? (
              <iframe src={signedUrl} width="100%" height="100%" title={document.name} className="border-0 rounded-md" />
            ) : isImage ? (
              <img src={signedUrl} alt={`Previsualización de ${document.name}`} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <p className="text-lg font-semibold">Previsualización no disponible</p>
                <p className="text-muted-foreground text-sm">El formato "{document.file_type}" no se puede mostrar aquí.</p>
                <Button asChild className="mt-4">
                  <a href={signedUrl} download={document.name}>Descargar archivo</a>
                </Button>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}