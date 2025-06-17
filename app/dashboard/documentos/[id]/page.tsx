"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
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

export default function DocumentViewerPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const { toast } = useToast()

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para la URL de previsualización
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [editForm, setEditForm] = useState<Partial<Document>>({})

  const fetchDocument = useCallback(async () => {
    if (!documentId) return

    setIsLoading(true)
    setError(null)
    setPreviewUrl(null)
    setPreviewError(null)

    try {
      const doc = await documentService.getDocumentById(documentId)
      if (doc) {
        setDocument(doc)
        setEditForm(doc)

        if (doc.file_path) {
            const { data, error: urlError } = await supabase.storage
                .from("documents")
                .createSignedUrl(doc.file_path, 3600); // 1 hora de validez

            if (urlError) {
                console.error("Error al generar URL firmada:", urlError);
                setPreviewError("No se pudo cargar la vista previa del archivo.");
            } else {
                setPreviewUrl(data.signedUrl);
            }
        } else {
            setPreviewError("El documento no tiene un archivo asociado.");
        }

      } else {
        setError("No se pudo encontrar el documento.");
      }
    } catch (error: any) {
      console.error("Error fetching document:", error)
      setError(error.message || "Error al cargar el documento")
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchDocument()
  }, [documentId, fetchDocument])

  const handleDownload = () => {
    if (previewUrl) {
      // Abre la URL segura en una nueva pestaña, el navegador gestionará la descarga
      window.open(previewUrl, "_blank")
    } else {
        toast({
            title: "Error de descarga",
            description: "No hay una URL de archivo válida para descargar.",
            variant: "destructive"
        })
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
    if (confirm("¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.")) {
        setIsLoading(true); // Reutilizamos el estado de carga principal
        try {
            await documentService.deleteDocument(documentId);
            toast({ title: "Documento eliminado", description: "El documento ha sido eliminado exitosamente." });
            router.push("/dashboard/documentos");
        } catch (error: any) {
            console.error("Error deleting document:", error);
            toast({ title: "Error", description: "No se pudo eliminar el documento.", variant: "destructive" });
            setIsLoading(false);
        }
    }
  }

  const renderPreview = () => {
    if (!previewUrl && !previewError) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (previewError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-muted p-8">
            <FileWarning className="h-16 w-16 text-destructive mb-4" />
            <p className="text-center font-semibold text-destructive">{previewError}</p>
        </div>
      );
    }

    const isImage = document && ["jpg", "jpeg", "png", "gif", "webp"].includes(document.file_type.toLowerCase())
    const isPdf = document && document.file_type.toLowerCase() === "pdf"

    return (
        <div
            className="relative h-full w-full"
            style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
            }}
        >
            {isImage ? (
                <img src={previewUrl!} alt={document!.name} className="max-w-full max-h-full object-contain" />
            ) : isPdf ? (
                <iframe src={previewUrl!} title={document!.name} className="h-full w-full border-0" />
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <FileText className="h-24 w-24 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">Vista previa no disponible</h3>
                    <p className="text-muted-foreground mb-4">No se puede mostrar una vista previa para este tipo de archivo ({document!.file_type}).</p>
                    <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Descargar archivo</Button>
                </div>
            )}
        </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Cargando documento...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Guard Clause: Asegura que el documento existe antes de renderizar el resto de la página.
  if (!document) {
    return (
       <div className="space-y-6 p-4 md:p-6">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo encontrar el documento solicitado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{document.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/compartir/${documentId}`)}><Share2 className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="text-destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(50, z - 25))}><ZoomOut className="h-4 w-4" /></Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(200, z + 25))}><ZoomIn className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setRotation(r => r - 90)}><RotateCcw className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden h-[800px]">
            <CardContent className="p-0 flex items-center justify-center h-full w-full">
              {renderPreview()}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Tabs defaultValue="info" onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="related">Relacionados</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="p-4 space-y-4">
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
              <TabsContent value="history" className="p-4"><DocumentHistory documentId={document.id} /></TabsContent>
              <TabsContent value="related" className="p-4"><DocumentRelated documentId={document.id} /></TabsContent>
              <TabsContent value="notes" className="p-4"><DocumentAnnotations documentId={document.id} /></TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}