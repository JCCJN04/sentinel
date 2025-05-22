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
  FileIcon as FilePdf, // Renamed to avoid conflict if you have a FileIcon component
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("todos") // Default category
  const [documents, setDocuments] = useState<Document[]>([]) // Holds documents for the active category (or all)
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]) // Further filtered by search query
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  // Fetch documents when the activeCategory changes or on initial mount
  useEffect(() => {
    fetchDocuments()
  }, [activeCategory]) // Re-fetch when activeCategory changes

  // Filter documents when the base 'documents' list changes or when searchQuery changes
  useEffect(() => {
    filterDocuments()
  }, [searchQuery, documents]) // Depends on searchQuery and the fetched documents

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
      setDocuments(docs) // This will store the documents for the current category (or all)
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Error al cargar los documentos. Por favor, inténtalo de nuevo.")
      setDocuments([]) // Clear documents on error
    } finally {
      setIsLoading(false)
    }
  }

  // Apply search query to the current list of documents (which is already category-scoped)
  const filterDocuments = () => {
    let tempFiltered = [...documents]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      tempFiltered = tempFiltered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.category.toLowerCase().includes(query) || // Allows searching category name within results
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }
    setFilteredDocuments(tempFiltered)
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
      setIsLoading(true); // Show loading while deleting
      await documentService.deleteDocument(documentToDelete)
      // Re-fetch documents for the current category after deletion
      await fetchDocuments();
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error: any) {
      console.error("Error deleting document:", error)
      setError("Error al eliminar el documento. Por favor, inténtalo de nuevo más tarde.")
      setDeleteDialogOpen(false) // Close dialog even on error
    } finally {
        setIsLoading(false);
    }
  }

  const confirmDelete = (id: string) => {
    setDocumentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) { // Added toLowerCase for robustness
      case "pdf":
        return <FilePdf className="h-5 w-5 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp": // Added webp
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
    switch (status?.toLowerCase()) { // Added toLowerCase for robustness
      case "vigente":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-400 dark:border-green-600">
            Vigente
          </Badge>
        )
      case "próximo a vencer":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-400 dark:border-yellow-500">
            Próximo a vencer
          </Badge>
        )
      case "vencido":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-700/20 dark:text-red-400 dark:border-red-600">
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status || "Desconocido"}</Badge>
    }
  }

  const getDocumentThumbnail = (doc: Document) => {
    const fileType = doc.file_type?.toLowerCase() || ""

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
      return (
        <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden group">
          <img
            src={doc.file_url || `https://placehold.co/400x300/EEE/CCC?text=No+Imagen`}
            alt={doc.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/400x300/EEE/CCC?text=Error`
            }}
          />
        </div>
      )
    } else if (fileType === "pdf") {
      return (
        <div className="relative w-full aspect-[4/3] bg-red-50 dark:bg-red-900/30 rounded-md flex items-center justify-center group">
          <FilePdf className="h-12 w-12 text-red-500 dark:text-red-400 transition-transform duration-300 group-hover:scale-110" />
        </div>
      )
    } else {
      const IconComponent = getFileIcon(fileType).type // Get the actual icon component
      return (
        <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center group">
           <IconComponent className="h-12 w-12 text-slate-500 dark:text-slate-400 transition-transform duration-300 group-hover:scale-110" />
        </div>
      )
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">Explora y gestiona todos tus documentos.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, categoría, etiqueta..."
            className="w-full pl-10 pr-4 py-2" // Adjusted padding
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Placeholder for potential future filter button */}
          {/* <Button variant="outline" size="icon" aria-label="Aplicar filtros">
            <Filter className="h-4 w-4" />
          </Button> */}

          <div className="border rounded-md flex bg-background">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none border-r"
              onClick={() => setViewMode("list")}
              aria-label="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("grid")}
              aria-label="Vista de cuadrícula"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="todos" value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {/* Made TabsList responsive and wrap */}
          <TabsTrigger value="todos" className="w-full sm:w-auto">Todos</TabsTrigger>
          <TabsTrigger value="hogar" className="w-full sm:w-auto">Hogar</TabsTrigger>
          <TabsTrigger value="finanzas" className="w-full sm:w-auto">Finanzas</TabsTrigger>
          <TabsTrigger value="salud" className="w-full sm:w-auto">Salud</TabsTrigger>
          <TabsTrigger value="vehiculos" className="w-full sm:w-auto">Vehículos</TabsTrigger>
          <TabsTrigger value="educacion" className="w-full sm:w-auto">Educación</TabsTrigger>
          <TabsTrigger value="identidad" className="w-full sm:w-auto">Identidad</TabsTrigger>
          {/* You might want to fetch categories dynamically if they can change */}
          <TabsTrigger value="otros" className="w-full sm:w-auto">Otros</TabsTrigger>
        </TabsList>

        {/* The TabsContent value prop is not strictly necessary if you only have one content area that updates */}
        <div className="mt-4"> {/* Replaced TabsContent with a simple div */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <span className="text-muted-foreground">Cargando documentos...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-card shadow-sm">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">
                No hay documentos
              </h3>
              <p className="text-muted-foreground mb-4 px-4">
                {searchQuery
                  ? "No se encontraron documentos que coincidan con tu búsqueda."
                  : activeCategory === "todos"
                  ? "Aún no has subido ningún documento."
                  : `Aún no has subido ningún documento en la categoría "${activeCategory}".`}
              </p>
              <Button onClick={() => router.push("/dashboard/subir")}>Subir documento</Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="rounded-md border bg-card shadow-sm">
              {/* List View Header - consider making it sticky or part of a table component */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_minmax(0,_50px)] items-center gap-4 p-3 font-medium border-b bg-muted/50 text-sm">
                <div className="text-muted-foreground">Tipo</div>
                <div className="text-muted-foreground">Nombre</div>
                <div className="text-muted-foreground">Categoría</div>
                <div className="text-muted-foreground">Fecha</div>
                <div className="text-muted-foreground">Estado</div>
                <div className="text-muted-foreground text-right">Acciones</div>
              </div>

              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_minmax(0,_50px)] items-center gap-4 p-3 hover:bg-muted/80 dark:hover:bg-muted/20 transition-colors cursor-pointer border-b last:border-b-0"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  <div className="flex justify-center items-center w-8 h-8">{getFileIcon(doc.file_type)}</div>
                  <div className="truncate">
                    <div className="font-medium text-card-foreground truncate" title={doc.name}>{doc.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.slice(0, 3).map((tag, i) => ( // Show up to 3 tags
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                       {doc.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{doc.category}</div>
                  <div className="text-sm text-muted-foreground">{new Date(doc.date).toLocaleDateString()}</div>
                  <div>{getStatusBadge(doc.status)}</div>
                  <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Más acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => doc.file_url && window.open(doc.file_url, "_blank")}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Descargar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          <span>Compartir</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => confirmDelete(doc.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : ( // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  {getDocumentThumbnail(doc)}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold leading-none tracking-tight truncate flex-grow mr-2" title={doc.name}>
                        {doc.name}
                      </h3>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Más acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => doc.file_url && window.open(doc.file_url, "_blank")}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Descargar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Compartir</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => confirmDelete(doc.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                      <span className="truncate" title={doc.category}>{doc.category}</span>
                      {getStatusBadge(doc.status)}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map((tag, i) => (
                         <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}