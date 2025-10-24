"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Download,
  Eye,
  FileText,
  FileWarning,
  Loader2,
  Pencil,
  RotateCcw,
  RotateCw,
  Share2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Calendar,
  Tag,
  Printer,
  ExternalLink,
  Clock,
} from "lucide-react"
import { DocumentMetadata } from "@/components/document-viewer/document-metadata"
import { DocumentHistory } from "@/components/document-viewer/document-history"
import { DocumentRelated } from "@/components/document-viewer/document-related"
import { DocumentAnnotations } from "@/components/document-viewer/document-annotations"
import { documentService, type Document } from "@/lib/document-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { supabaseBrowserClient as supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DocumentViewerPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const { toast } = useToast()

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [editForm, setEditForm] = useState<Partial<Document>>({})

  const fetchDocument = useCallback(async () => {
    if (!documentId) return

    setIsLoading(true)
    setError(null)
    setPreviewUrl(null)
    setPreviewError(null)
    setPreviewLoading(true)

    try {
      const doc = await documentService.getDocumentById(documentId)
      if (doc) {
        setDocument(doc)
        setEditForm(doc)

        if (doc.file_path) {
          try {
            const { data, error: urlError } = await supabase.storage
              .from("documents")
              .createSignedUrl(doc.file_path, 3600)

            if (urlError) {
              console.error("Error al generar URL firmada:", urlError)
              setPreviewError("No se pudo cargar la vista previa del archivo.")
            } else if (data?.signedUrl) {
              setPreviewUrl(data.signedUrl)
            }
          } catch (urlError) {
            console.error("Exception creating signed URL:", urlError)
            setPreviewError("Error al generar el enlace seguro del archivo.")
          }
        } else {
          setPreviewError("El documento no tiene un archivo asociado.")
        }
      } else {
        setError("No se pudo encontrar el documento.")
      }
    } catch (error: any) {
      console.error("Error fetching document:", error)
      setError(error.message || "Error al cargar el documento")
    } finally {
      setIsLoading(false)
      setPreviewLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchDocument()
  }, [documentId, fetchDocument])

  const handleDownload = async () => {
    if (!previewUrl || !document) {
      toast({
        title: "Error de descarga",
        description: "No hay una URL de archivo válida para descargar.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = globalThis.document.createElement('a')
      a.href = url
      a.download = document.name || 'documento'
      globalThis.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      globalThis.document.body.removeChild(a)
      
      toast({
        title: "Descarga iniciada",
        description: `"${document.name}" se está descargando...`,
      })
    } catch (error) {
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo.",
        variant: "destructive"
      })
    }
  }

  const handlePrint = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank")
    }
  }

  const handleCopyUrl = async () => {
    if (previewUrl) {
      try {
        await navigator.clipboard.writeText(previewUrl)
        toast({
          title: "Enlace copiado",
          description: "La URL del documento se copió al portapapeles.",
        })
      } catch {
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSaveChanges = async () => {
    if (!document) return

    setIsSaving(true)
    setError(null)

    try {
      const updatedDoc = await documentService.updateDocument(documentId, editForm)
      setDocument(updatedDoc)
      setIsEditing(false)
      toast({
        title: "Documento actualizado",
        description: "Los cambios se han guardado correctamente.",
      })
    } catch (error: any) {
      console.error("Error updating document:", error)
      setError(error.message || "Error al actualizar el documento")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await documentService.deleteDocument(documentId)
      toast({ 
        title: "Documento eliminado", 
        description: "El documento ha sido eliminado exitosamente.",
        variant: "default"
      })
      router.push("/dashboard/documentos")
    } catch (error: any) {
      console.error("Error deleting document:", error)
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar el documento.",
        variant: "destructive" 
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }
    
    if (previewError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
          <FileWarning className="h-16 w-16 text-amber-500 mb-4" />
          <p className="text-center font-semibold text-slate-700 dark:text-slate-300 mb-4">{previewError}</p>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar archivo
          </Button>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
          </div>
        </div>
      )
    }

    const isImage = document && ["jpg", "jpeg", "png", "gif", "webp"].includes(document.file_type.toLowerCase())
    const isPdf = document && document.file_type.toLowerCase() === "pdf"

    return (
      <div
        className="relative h-full w-full overflow-auto flex items-center justify-center"
        style={{
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transition: "transform 0.3s ease",
        }}
      >
        {isImage ? (
          <img 
            src={previewUrl} 
            alt={document!.name} 
            className="max-w-full max-h-full object-contain drop-shadow-lg rounded-lg" 
          />
        ) : isPdf ? (
          <iframe 
            src={previewUrl} 
            title={document!.name} 
            className="h-full w-full border-0 rounded-lg" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full max-w-sm">
            <div className="mb-4 p-4 rounded-full bg-slate-100 dark:bg-slate-800">
              <FileText className="h-12 w-12 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Vista previa no disponible</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Este tipo de archivo ({document!.file_type}) no puede ser previsualizdo, pero puedes descargarlo.
            </p>
            <Button onClick={handleDownload} variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar archivo
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-1">Cargando documento...</h2>
                <p className="text-sm text-muted-foreground">Por favor espera un momento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }
  
  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No se pudo encontrar el documento solicitado.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold truncate">{document.name}</h1>
                {document.category && (
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {document.category}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Status badges + Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {document.status && (
                <Badge 
                  variant={
                    document.status === "vigente" ? "default" :
                    document.status === "próximo a vencer" ? "secondary" :
                    "destructive"
                  }
                  className="hidden sm:inline-flex"
                >
                  {document.status === "vigente" && "✓ Vigente"}
                  {document.status === "próximo a vencer" && "⚠ Por vencer"}
                  {document.status === "vencido" && "✕ Vencido"}
                </Badge>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleDownload}
                  title="Descargar"
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handlePrint}
                  title="Abrir / Imprimir"
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => router.push(`/dashboard/compartir/${documentId}`)}
                  title="Compartir"
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Eliminar"
                  className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-7xl mx-auto">
          {/* Preview Section */}
          <div className="space-y-4">
            {/* Controls Bar */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setZoom(z => Math.max(50, z - 25))}
                      disabled={zoom <= 50}
                      className="h-9 px-3"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-14 text-center">{zoom}%</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setZoom(z => Math.min(200, z + 25))}
                      disabled={zoom >= 200}
                      className="h-9 px-3"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Rotation & Reset Controls */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRotation(r => r - 90)}
                      className="h-9 px-3"
                      title="Girar 90° izquierda"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setZoom(100); setRotation(0); }}
                      className="h-9 px-3 text-xs"
                    >
                      Restablecer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRotation(r => r + 90)}
                      className="h-9 px-3"
                      title="Girar 90° derecha"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyUrl}
                      className="h-9 px-3 hidden md:inline-flex"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar URL
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-0 flex items-center justify-center h-[calc(100vh-300px)] min-h-[600px] w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {renderPreview()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Info Card */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {document.date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="text-sm font-medium">{new Date(document.date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                )}
                
                {document.expiry_date && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className="text-sm font-medium">{new Date(document.expiry_date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                )}

                {document.category && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <p className="text-sm font-medium">{document.category}</p>
                    </div>
                  </div>
                )}

                {document.file_type && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de archivo</p>
                      <p className="text-sm font-medium uppercase">{document.file_type}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs Card */}
            <Card className="border-slate-200 dark:border-slate-800 flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none grid grid-cols-2 md:grid-cols-2 h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="info" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="text-xs">Info</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="text-xs">Historial</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="info" className="p-4 space-y-4 m-0">
                    <DocumentMetadata
                      document={document}
                      isEditing={isEditing}
                      editForm={editForm}
                      onFormChange={setEditForm}
                      onEditToggle={() => setIsEditing(!isEditing)}
                      onSaveChanges={handleSaveChanges}
                      isSaving={isSaving}
                    />
                  </TabsContent>
                  
                  <TabsContent value="history" className="p-4 m-0">
                    <DocumentHistory documentId={document.id} />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Eliminar documento
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{document.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}