"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, FileText, Link2, Mail, MoreHorizontal, QrCode, RefreshCw, Trash2, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { documentService } from "@/lib/document-service"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SharedDocument {
  id: string
  document_id: string
  document: {
    id: string
    name: string
    file_type: string
  }
  shared_with: string
  created_at: string
  expiry_date: string
  share_method: string
  status: string
  access_count: number
  permissions: {
    view: boolean
    download: boolean
    edit: boolean
    print: boolean
  }
}

const getMethodIcon = (method: string) => {
  switch (method) {
    case "email":
      return <Mail className="h-4 w-4 text-primary" />
    case "link":
      return <Link2 className="h-4 w-4 text-success" />
    case "qr":
      return <QrCode className="h-4 w-4 text-info" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success">
          Activo
        </Badge>
      )
    case "expired":
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
          Expirado
        </Badge>
      )
    default:
      return <Badge variant="outline">Desconocido</Badge>
  }
}

export default function CompartidosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadSharedDocuments() {
      try {
        setIsLoading(true)
        const data = await documentService.getSharedDocuments()

        // Procesar los datos para asegurar que tienen el formato correcto
        const processedData = data.map((item) => {
          // Determinar el estado basado en la fecha de expiración
          const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null
          const status = expiryDate && expiryDate < new Date() ? "expired" : "active"

          return {
            ...item,
            status,
            // Asegurar que access_count existe
            access_count: item.access_count || 0,
            // Asegurar que permissions existe
            permissions: item.permissions || {
              view: true,
              download: false,
              edit: false,
              print: false,
            },
          }
        })

        setSharedDocuments(processedData)
      } catch (error) {
        console.error("Error al cargar documentos compartidos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos compartidos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSharedDocuments()
  }, [toast])

  const filteredDocuments = sharedDocuments.filter(
    (doc) =>
      doc.document?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.shared_with?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeDocuments = filteredDocuments.filter((doc) => doc.status === "active")
  const expiredDocuments = filteredDocuments.filter((doc) => doc.status === "expired")

  const handleCopyLink = async (shareId: string) => {
    try {
      // Construir la URL de compartición
      const shareUrl = `${window.location.origin}/compartir/${shareId}`
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles",
      })
    } catch (error) {
      console.error("Error al copiar enlace:", error)
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleRenewAccess = async (shareId: string) => {
    try {
      // Calcular nueva fecha de expiración (30 días desde hoy)
      const newExpiryDate = new Date()
      newExpiryDate.setDate(newExpiryDate.getDate() + 30)

      // Actualizar el registro de compartición
      await documentService.updateSharedDocument(shareId, {
        expiry_date: newExpiryDate.toISOString(),
        status: "active",
      })

      // Actualizar la lista local
      setSharedDocuments((prev) =>
        prev.map((doc) =>
          doc.id === shareId ? { ...doc, expiry_date: newExpiryDate.toISOString(), status: "active" } : doc,
        ),
      )

      toast({
        title: "Acceso renovado",
        description: "El acceso ha sido renovado por 30 días más",
      })
    } catch (error) {
      console.error("Error al renovar acceso:", error)
      toast({
        title: "Error",
        description: "No se pudo renovar el acceso",
        variant: "destructive",
      })
    }
  }

  const handleRevokeAccess = async (shareId: string) => {
    try {
      // Eliminar el registro de compartición
      await documentService.deleteSharedDocument(shareId)

      // Actualizar la lista local
      setSharedDocuments((prev) => prev.filter((doc) => doc.id !== shareId))

      toast({
        title: "Acceso revocado",
        description: "El acceso ha sido revocado exitosamente",
      })
    } catch (error) {
      console.error("Error al revocar acceso:", error)
      toast({
        title: "Error",
        description: "No se pudo revocar el acceso",
        variant: "destructive",
      })
    }
  }

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  // Renderizar skeleton loader durante la carga
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos compartidos</h1>
          <p className="text-muted-foreground">Gestiona los documentos que has compartido con otras personas.</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-full md:w-96" />
        </div>

        <Tabs defaultValue="todos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="expirados">Expirados</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos compartidos</h1>
        <p className="text-muted-foreground">Gestiona los documentos que has compartido con otras personas.</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Input
            type="search"
            placeholder="Buscar documentos compartidos..."
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({filteredDocuments.length})</TabsTrigger>
          <TabsTrigger value="activos">Activos ({activeDocuments.length})</TabsTrigger>
          <TabsTrigger value="expirados">Expirados ({expiredDocuments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los documentos compartidos</CardTitle>
              <CardDescription>Lista de todos los documentos que has compartido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 p-4 font-medium border-b">
                  <div>Documento</div>
                  <div>Compartido con</div>
                  <div>Expira</div>
                  <div>Estado</div>
                  <div></div>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No se encontraron documentos compartidos.</div>
                ) : (
                  filteredDocuments.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full p-1 bg-muted">{getMethodIcon(item.share_method)}</div>
                        <div>
                          <p className="font-medium">{item.document?.name || "Documento sin nombre"}</p>
                          <p className="text-xs text-muted-foreground md:hidden">Compartido con: {item.shared_with}</p>
                          <p className="text-xs text-muted-foreground">
                            Compartido el {formatDate(item.created_at)} • {item.access_count} accesos
                          </p>
                          <div className="md:hidden mt-1">{getStatusBadge(item.status)}</div>
                        </div>
                      </div>
                      <div className="text-sm hidden md:block">{item.shared_with}</div>
                      <div className="text-sm hidden md:block">{formatDate(item.expiry_date)}</div>
                      <div className="hidden md:block">{getStatusBadge(item.status)}</div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyLink(item.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Copiar enlace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRenewAccess(item.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Renovar acceso</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRevokeAccess(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Revocar acceso</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos compartidos activos</CardTitle>
              <CardDescription>Documentos con acceso compartido vigente</CardDescription>
            </CardHeader>
            <CardContent>
              {activeDocuments.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No hay documentos compartidos activos</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 font-medium border-b">
                    <div>Documento</div>
                    <div>Compartido con</div>
                    <div>Expira</div>
                    <div></div>
                  </div>

                  {activeDocuments.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full p-1 bg-muted">{getMethodIcon(item.share_method)}</div>
                        <div>
                          <p className="font-medium">{item.document?.name || "Documento sin nombre"}</p>
                          <p className="text-xs text-muted-foreground md:hidden">Compartido con: {item.shared_with}</p>
                          <p className="text-xs text-muted-foreground">
                            Compartido el {formatDate(item.created_at)} • {item.access_count} accesos
                          </p>
                        </div>
                      </div>
                      <div className="text-sm hidden md:block">{item.shared_with}</div>
                      <div className="text-sm hidden md:block">{formatDate(item.expiry_date)}</div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyLink(item.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Copiar enlace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRenewAccess(item.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Renovar acceso</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRevokeAccess(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Revocar acceso</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expirados">
          <Card>
            <CardHeader>
              <CardTitle>Documentos compartidos expirados</CardTitle>
              <CardDescription>Documentos con acceso compartido vencido</CardDescription>
            </CardHeader>
            <CardContent>
              {expiredDocuments.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No hay documentos compartidos expirados</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 font-medium border-b">
                    <div>Documento</div>
                    <div>Compartido con</div>
                    <div>Expiró</div>
                    <div></div>
                  </div>

                  {expiredDocuments.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full p-1 bg-muted">{getMethodIcon(item.share_method)}</div>
                        <div>
                          <p className="font-medium">{item.document?.name || "Documento sin nombre"}</p>
                          <p className="text-xs text-muted-foreground md:hidden">Compartido con: {item.shared_with}</p>
                          <p className="text-xs text-muted-foreground">
                            Compartido el {formatDate(item.created_at)} • {item.access_count} accesos
                          </p>
                        </div>
                      </div>
                      <div className="text-sm hidden md:block">{item.shared_with}</div>
                      <div className="text-sm hidden md:block">{formatDate(item.expiry_date)}</div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRenewAccess(item.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Renovar acceso</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRevokeAccess(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Revocar acceso</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de compartición</CardTitle>
          <CardDescription>Resumen de la actividad de compartición de documentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total compartidos</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{sharedDocuments.length}</p>
            </div>

            <div className="space-y-2 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activos</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  Activo
                </Badge>
              </div>
              <p className="text-2xl font-bold">{activeDocuments.length}</p>
            </div>

            <div className="space-y-2 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expirados</span>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                  Expirado
                </Badge>
              </div>
              <p className="text-2xl font-bold">{expiredDocuments.length}</p>
            </div>

            <div className="space-y-2 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total de accesos</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {sharedDocuments.reduce((sum, doc) => sum + (doc.access_count || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
