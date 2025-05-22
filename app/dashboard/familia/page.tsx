"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Loader2,
  MoreHorizontal,
  Share2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { familyService, type FamilyMember } from "@/lib/family-service"

export default function FamiliaPage() {
  const [activeTab, setActiveTab] = useState("miembros")
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    member_email: "",
    member_name: "",
    relationship: "familiar",
    permissions: {
      view_all: true,
      download: false,
      edit: false,
      categories: [] as string[], // Ensure type consistency
    },
  })
  const [isInviting, setIsInviting] = useState(false)

  // Remove member dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  // Edit permissions dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null)
  const [editForm, setEditForm] = useState({
    permissions: {
      view_all: true,
      download: false,
      edit: false,
      categories: [] as string[], // Corrected: Explicitly type as string[]
    },
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [members, shared] = await Promise.all([
        familyService.getFamilyMembers(),
        familyService.getSharedDocumentsWithFamily(),
      ])
      setFamilyMembers(members)
      setSharedDocuments(shared)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Error al cargar los datos. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async () => {
    setIsInviting(true)
    setError(null)

    try {
      // Validate form
      if (!inviteForm.member_email || !inviteForm.member_name) {
        throw new Error("Por favor, completa todos los campos obligatorios.")
      }

      // Send invitation
      await familyService.inviteFamilyMember(inviteForm)

      // Refresh data
      await fetchData()

      // Close dialog and show success message
      setInviteDialogOpen(false)
      setSuccess("Invitación enviada correctamente.")

      // Reset form
      setInviteForm({
        member_email: "",
        member_name: "",
        relationship: "familiar",
        permissions: {
          view_all: true,
          download: false,
          edit: false,
          categories: [] as string[], // Ensure type consistency
        },
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error: any) {
      console.error("Error inviting family member:", error)
      setError(error.message || "Error al enviar la invitación. Por favor, inténtalo de nuevo.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await familyService.removeFamilyMember(memberToRemove)

      // Refresh data
      await fetchData()

      // Close dialog and show success message
      setRemoveDialogOpen(false)
      setMemberToRemove(null)
      setSuccess("Miembro eliminado correctamente.")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error removing family member:", error)
      setError("Error al eliminar el miembro. Por favor, inténtalo de nuevo.")
    }
  }

  const handleEditMember = async () => {
    if (!memberToEdit) return

    setIsEditing(true)
    setError(null)

    try {
      await familyService.updateFamilyMember(memberToEdit.id, {
        permissions: editForm.permissions,
      })

      // Refresh data
      await fetchData()

      // Close dialog and show success message
      setEditDialogOpen(false)
      setMemberToEdit(null)
      setSuccess("Permisos actualizados correctamente.")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error updating family member:", error)
      setError("Error al actualizar los permisos. Por favor, inténtalo de nuevo.")
    } finally {
      setIsEditing(false)
    }
  }

  const startEditMember = (member: FamilyMember) => {
    setMemberToEdit(member)
    setEditForm({
      permissions: { ...member.permissions }, // This spread should now work correctly
    })
    setEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success">
            Activo
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            Pendiente
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
            Rechazado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case "conyuge":
        return "Cónyuge"
      case "hijo":
        return "Hijo/a"
      case "padre":
        return "Padre/Madre"
      case "hermano":
        return "Hermano/a"
      case "familiar":
        return "Familiar"
      default:
        return relationship
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Familiar</h1>
        <p className="text-muted-foreground">Gestiona el acceso de tu familia a tus documentos importantes.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-success/10 text-success border-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan Familiar</CardTitle>
          <CardDescription>Tu plan actual incluye hasta 5 miembros de familia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full p-3 bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Plan Familiar Activo</h3>
                  <p className="text-sm text-muted-foreground">
                    Comparte documentos importantes con hasta 5 miembros de tu familia
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">Miembros</div>
                  <div className="text-2xl font-bold">{familyMembers.length} / 5</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">Documentos compartidos</div>
                  <div className="text-2xl font-bold">{sharedDocuments.length}</div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invitar miembro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="miembros">Miembros</TabsTrigger>
          <TabsTrigger value="documentos">Documentos compartidos</TabsTrigger>
          <TabsTrigger value="actividad">Actividad reciente</TabsTrigger>
        </TabsList>

        <TabsContent value="miembros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Miembros de la familia</CardTitle>
              <CardDescription>Gestiona los miembros de tu familia y sus permisos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Cargando miembros...</span>
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay miembros</h3>
                  <p className="text-muted-foreground mb-4">Aún no has invitado a ningún miembro de tu familia.</p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar miembro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(member.member_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.member_name}</div>
                          <div className="text-sm text-muted-foreground">{member.member_email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {getRelationshipText(member.relationship)}
                            </span>
                            {getStatusBadge(member.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditMember(member)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Permisos
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditMember(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar permisos</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setMemberToRemove(member.id)
                                setRemoveDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar miembro</span>
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

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos compartidos</CardTitle>
              <CardDescription>Documentos que has compartido con miembros de tu familia</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Cargando documentos...</span>
                </div>
              ) : sharedDocuments.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hay documentos compartidos</h3>
                  <p className="text-muted-foreground mb-4">Aún no has compartido ningún documento con tu familia.</p>
                  <Button onClick={() => alert("Funcionalidad en desarrollo")}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir documento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedDocuments.map((shared) => (
                    <div key={shared.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-2 bg-muted">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{shared.document.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Compartido con: {shared.member.member_name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Compartido el: {new Date(shared.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => alert("Funcionalidad en desarrollo")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>Actividad reciente de los miembros de tu familia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Próximamente</h3>
                <p className="text-muted-foreground">El registro de actividad estará disponible próximamente.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitar miembro de familia</DialogTitle>
            <DialogDescription>
              Invita a un miembro de tu familia para compartir documentos importantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member_name">Nombre completo</Label>
              <Input
                id="member_name"
                value={inviteForm.member_name}
                onChange={(e) => setInviteForm({ ...inviteForm, member_name: e.target.value })}
                placeholder="Nombre del familiar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member_email">Correo electrónico</Label>
              <Input
                id="member_email"
                type="email"
                value={inviteForm.member_email}
                onChange={(e) => setInviteForm({ ...inviteForm, member_email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relación</Label>
              <Select
                value={inviteForm.relationship}
                onValueChange={(value) => setInviteForm({ ...inviteForm, relationship: value })}
              >
                <SelectTrigger id="relationship">
                  <SelectValue placeholder="Selecciona relación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conyuge">Cónyuge</SelectItem>
                  <SelectItem value="hijo">Hijo/a</SelectItem>
                  <SelectItem value="padre">Padre/Madre</SelectItem>
                  <SelectItem value="hermano">Hermano/a</SelectItem>
                  <SelectItem value="familiar">Otro familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Permisos</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="view_all" className="flex-1">
                  Ver todos los documentos
                  <p className="text-xs text-muted-foreground">Puede ver todos tus documentos</p>
                </Label>
                <Switch
                  id="view_all"
                  checked={inviteForm.permissions.view_all}
                  onCheckedChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, view_all: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="download" className="flex-1">
                  Descargar documentos
                  <p className="text-xs text-muted-foreground">Puede descargar los documentos compartidos</p>
                </Label>
                <Switch
                  id="download"
                  checked={inviteForm.permissions.download}
                  onCheckedChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, download: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit" className="flex-1">
                  Editar documentos
                  <p className="text-xs text-muted-foreground">Puede editar la información de los documentos</p>
                </Label>
                <Switch
                  id="edit"
                  checked={inviteForm.permissions.edit}
                  onCheckedChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, edit: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enviar invitación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al miembro de tu familia y revocará su acceso a todos los documentos compartidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar permisos</DialogTitle>
            <DialogDescription>Modifica los permisos de acceso para este miembro de la familia.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {memberToEdit && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(memberToEdit.member_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{memberToEdit.member_name}</div>
                  <div className="text-sm text-muted-foreground">{memberToEdit.member_email}</div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Permisos</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit_view_all" className="flex-1">
                  Ver todos los documentos
                  <p className="text-xs text-muted-foreground">Puede ver todos tus documentos</p>
                </Label>
                <Switch
                  id="edit_view_all"
                  checked={editForm.permissions.view_all}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      permissions: { ...editForm.permissions, view_all: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit_download" className="flex-1">
                  Descargar documentos
                  <p className="text-xs text-muted-foreground">Puede descargar los documentos compartidos</p>
                </Label>
                <Switch
                  id="edit_download"
                  checked={editForm.permissions.download}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      permissions: { ...editForm.permissions, download: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit_edit" className="flex-1">
                  Editar documentos
                  <p className="text-xs text-muted-foreground">Puede editar la información de los documentos</p>
                </Label>
                <Switch
                  id="edit_edit"
                  checked={editForm.permissions.edit}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      permissions: { ...editForm.permissions, edit: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}