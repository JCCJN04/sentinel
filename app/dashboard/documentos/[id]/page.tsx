"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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

export default function DocumentViewerPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const { toast } = useToast()
  const documentContainerRef = useRef<HTMLDivElement>(null)

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [editForm, setEditForm] = useState<Partial<Document>>({})

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return

      setIsLoading(true)
      setError(null)

      try {
        const doc = await documentService.getDocumentById(documentId)
        setDocument(doc)
        // Inicializar el formulario de edición con los datos del documento
        setEditForm({
          name: doc?.name,
          category: doc?.category,
          date: doc?.date,
          expiry_date: doc?.expiry_date,
          provider: doc?.provider,
          amount: doc?.amount,
          currency: doc?.currency,
          tags: doc?.tags,
          notes: doc?.notes,
        })
      } catch (error: any) {
        console.error("Error fetching document:", error)
        setError(error.message || "Error al cargar el documento")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  // Ajustar el tamaño del contenedor del documento
  useEffect(() => {
    const adjustDocumentSize = () => {
      if (!documentContainerRef.current) return

      // Obtener el ancho del contenedor
      const containerWidth = documentContainerRef.current.clientWidth

      // Ajustar la altura en función del tipo de documento
      if (document) {
        const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(document.file_type.toLowerCase())
        const isPdf = document.file_type.toLowerCase() === "pdf"

        if (isImage) {
          // Para imágenes, mantener una proporción adecuada
          documentContainerRef.current.style.height = `${containerWidth * 0.75}px`
        } else if (isPdf) {
          // Para PDFs, usar una altura fija más grande
          documentContainerRef.current.style.height = "800px"
        } else {
          // Para otros tipos, una altura estándar
          documentContainerRef.current.style.height = "600px"
        }
      }
    }

    adjustDocumentSize()

    // Ajustar también cuando cambie el tamaño de la ventana
    window.addEventListener("resize", adjustDocumentSize)
    return () => window.removeEventListener("resize", adjustDocumentSize)
  }, [document, documentContainerRef])

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25)
  }

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25)
  }

  const handleRotateClockwise = () => {
    setRotation((rotation + 90) % 360)
  }

  const handleRotateCounterClockwise = () => {
    setRotation((rotation - 90 + 360) % 360)
  }

  const handleDownload = () => {
    if (document?.file_url) {
      window.open(document.file_url, "_blank")
    }
  }

  const handleShare = () => {
    router.push(`/dashboard/compartir/${documentId}`)
  }

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.")) {
      try {
        setError(null)
        await documentService.deleteDocument(documentId)
        router.push("/dashboard/documentos")
      } catch (error: any) {
        console.error("Error deleting document:", error)
        setError("Error al eliminar el documento. Por favor, inténtalo de nuevo más tarde.")
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    setEditForm((prev) => ({ ...prev, tags: tagsArray }))
  }

  const handleSaveChanges = async () => {
    if (!document) return

    setIsSaving(true)
    setError(null)

    try {
      // Actualizar el documento
      const updatedDoc = await documentService.updateDocument(documentId, editForm)

      // Actualizar el estado local
      setDocument(updatedDoc)

      // Salir del modo edición
      setIsEditing(false)

      // Mostrar mensaje de éxito
      toast({
        title: "Documento actualizado",
        description: "Los cambios se han guardado correctamente.",
        variant: "default",
      })
    } catch (error: any) {
      console.error("Error updating document:", error)
      setError(error.message || "Error al actualizar el documento")
    } finally {
      setIsSaving(false)
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Error</h1>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Documento no encontrado</h1>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo encontrar el documento solicitado.</AlertDescription>
        </Alert>

        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  // Determinar el tipo de previsualización según el tipo de archivo
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(document.file_type.toLowerCase())
  const isPdf = document.file_type.toLowerCase() === "pdf"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{document.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{zoom}%</span>
                <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRotateCounterClockwise}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRotateClockwise}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-0 flex items-center justify-center" ref={documentContainerRef}>
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                }}
              >
                {isImage ? (
                  // Previsualización de imagen
                  <img
                    src={document.file_url || "/placeholder.svg"}
                    alt={document.name}
                    className="max-w-full h-auto"
                    style={{ maxHeight: "100%" }}
                  />
                ) : isPdf ? (
                  // Previsualización de PDF
                  <object
                    data={document.file_url}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="border-0"
                  >
                    <p>
                      Tu navegador no puede mostrar PDFs.{" "}
                      <a href={document.file_url} target="_blank" rel="noreferrer">
                        Haz clic aquí para descargar el PDF
                      </a>
                      .
                    </p>
                  </object>
                ) : (
                  // Fallback para otros tipos de archivo
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="h-24 w-24 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">Vista previa no disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      No se puede mostrar una vista previa para este tipo de archivo ({document.file_type}).
                    </p>
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar archivo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="related">Relacionados</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Información del documento</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                    {isEditing ? "Ver" : "Editar"}
                  </Button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" value={editForm.name || ""} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                          value={editForm.category || ""}
                          onValueChange={(value) => handleSelectChange("category", value)}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hogar">Hogar</SelectItem>
                            <SelectItem value="finanzas">Finanzas</SelectItem>
                            <SelectItem value="salud">Salud</SelectItem>
                            <SelectItem value="vehiculos">Vehículos</SelectItem>
                            <SelectItem value="educacion">Educación</SelectItem>
                            <SelectItem value="identidad">Identidad</SelectItem>
                            <SelectItem value="otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={editForm.date || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiry_date">Vencimiento</Label>
                        <Input
                          id="expiry_date"
                          name="expiry_date"
                          type="date"
                          value={editForm.expiry_date || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provider">Proveedor/Entidad</Label>
                      <Input
                        id="provider"
                        name="provider"
                        value={editForm.provider || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input id="amount" name="amount" value={editForm.amount || ""} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select
                          value={editForm.currency || ""}
                          onValueChange={(value) => handleSelectChange("currency", value)}
                        >
                          <SelectTrigger id="currency">
                            <SelectValue placeholder="Selecciona moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                            <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                            <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        value={editForm.tags ? editForm.tags.join(", ") : ""}
                        onChange={handleTagsChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={editForm.notes || ""}
                        onChange={handleInputChange}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Guardar cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DocumentMetadata document={document} />
                )}
              </TabsContent>

              <TabsContent value="history" className="p-4">
                <DocumentHistory documentId={document.id} />
              </TabsContent>

              <TabsContent value="related" className="p-4">
                <DocumentRelated documentId={document.id} />
              </TabsContent>

              <TabsContent value="notes" className="p-4">
                <DocumentAnnotations documentId={document.id} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}