"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Tag,
  Loader2,
} from "lucide-react"
import { documentService, type Document } from "@/lib/document-service"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DocumentosPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid") // Cambiado a grid por defecto
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("todos")
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (documents.length > 0) {
      filterDocuments()
    }
  }, [searchQuery, activeCategory, documents])

  const fetchDocuments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let docs: Document[]
      if (activeCategory === "todos") {
        docs = await documentService.getDocuments()
      } else {
        docs = await documentService.getDocumentsByCategory(activeCategory)
      }
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Error al cargar los documentos. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    // Filter by category if not "todos"
    if (activeCategory !== "todos") {
      filtered = filtered.filter((doc) => doc.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.category.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleViewDocument = (id: string) => {
    router.push(`/dashboard/documentos/${id}`)
  }

  const handleShareDocument = (id: string) => {
    router.push(`/dashboard/compartir/${id}`)
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      setError(null)
      await documentService.deleteDocument(documentToDelete)
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentToDelete))
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error: any) {
      console.error("Error deleting document:", error)
      setError("Error al eliminar el documento. Por favor, inténtalo de nuevo más tarde.")
      setDeleteDialogOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDocumentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="h-5 w-5 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="h-5 w-5 text-blue-500" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vigente":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success">
            Vigente
          </Badge>
        )
      case "próximo a vencer":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            Próximo a vencer
          </Badge>
        )
      case "vencido":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  // Función para generar una miniatura para el documento
  const getDocumentThumbnail = (doc: Document) => {
    const fileType = doc.file_type.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
      // Para imágenes, usar la URL real
      return (
        <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden">
          <img
            src={doc.file_url || "/placeholder.svg"}
            alt={doc.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si hay error al cargar la imagen, mostrar un fallback
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=120&width=160"
            }}
          />
        </div>
      )
    } else if (fileType === "pdf") {
      // Para PDFs, mostrar un icono de PDF con fondo rojo
      return (
        <div className="relative w-full aspect-[4/3] bg-red-50 rounded-md flex items-center justify-center">
          <FilePdf className="h-12 w-12 text-red-500" />
        </div>
      )
    } else {
      // Para otros tipos de archivo, mostrar un icono genérico
      return (
        <div className="relative w-full aspect-[4/3] bg-muted rounded-md flex items-center justify-center">
          {getFileIcon(fileType)}
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">Explora y gestiona todos tus documentos.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar documentos..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          <div className="border rounded-md flex">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="todos" value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="hogar">Hogar</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          <TabsTrigger value="salud">Salud</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="educacion">Educación</TabsTrigger>
          <TabsTrigger value="identidad">Identidad</TabsTrigger>
          <TabsTrigger value="otros">Otros</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando documentos...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay documentos</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No se encontraron documentos que coincidan con tu búsqueda."
                  : "Aún no has subido ningún documento en esta categoría."}
              </p>
              <Button onClick={() => router.push("/dashboard/subir")}>Subir documento</Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 p-4 font-medium border-b">
                <div>Tipo</div>
                <div>Nombre</div>
                <div>Categoría</div>
                <div>Fecha</div>
                <div>Estado</div>
                <div></div>
              </div>

              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  <div>{getFileIcon(doc.file_type)}</div>
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.map((tag, i) => (
                        <div key={i} className="inline-flex items-center text-xs text-muted-foreground">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>{doc.category}</div>
                  <div>{doc.date}</div>
                  <div>{getStatusBadge(doc.status)}</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(doc.file_url, "_blank")}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Descargar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          <span>Compartir</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(doc.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-md border overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  {/* Miniatura del documento */}
                  {getDocumentThumbnail(doc)}

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate" title={doc.name}>
                        {doc.name}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(doc.file_url, "_blank")}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Descargar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Compartir</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(doc.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-muted-foreground">{doc.category}</div>
                      <div>{getStatusBadge(doc.status)}</div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map((tag, i) => (
                        <div key={i} className="inline-flex items-center text-xs text-muted-foreground">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </div>
                      ))}
                      {doc.tags.length > 2 && (
                        <div className="inline-flex items-center text-xs text-muted-foreground">
                          +{doc.tags.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el documento y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
