"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Pencil } from "lucide-react"
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  deleteUserAccount,
  type UserProfile,
} from "@/lib/user-service" // Assuming UserProfile includes avatar_url: string | null | undefined
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Define a more explicit type for your form data if not already done by UserProfile
interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  date_format: string;
  avatar_url: string; // Keeping as string, matching initialization
}

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // UserData from service might have avatar_url as string | null
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    language: "es",
    timezone: "America/Mexico_City",
    date_format: "DD/MM/YYYY",
    avatar_url: "", // Initialized as empty string
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    setIsLoading(true)
    try {
      const profile = await getUserProfile()
      if (profile) {
        setUserData(profile)
        setFormData({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "", // Email usually comes from auth user, ensure it's correct source
          phone: profile.phone || "",
          language: profile.language || "es",
          timezone: profile.timezone || "America/Mexico_City",
          date_format: profile.date_format || "DD/MM/YYYY",
          avatar_url: profile.avatar_url || "", // Fallback to empty string if null/undefined
        })
      }
    } catch (error) {
      console.error("Error al cargar el perfil:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Exclude email and avatar_url from the update object sent to updateUserProfile
      // if they are managed separately or are not part of the UserProfile updatable fields.
      const profileUpdates: Partial<UserProfile> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        language: formData.language,
        timezone: formData.timezone,
        date_format: formData.date_format,
        // avatar_url is updated via updateUserAvatar
      };

      const result = await updateUserProfile(profileUpdates)

      if (result.success) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información personal ha sido actualizada correctamente",
        })
        setIsEditing(false)
        // Reload user profile to reflect changes, especially if `updateUserProfile` returns the updated profile
        // or if `avatar_url` was part of the update (though it's handled separately here)
        await loadUserProfile(); // Re-fetch the profile
      } else {
        throw new Error(result.error || "Error desconocido al actualizar perfil")
      }
    } catch (error) {
      console.error("Error al guardar el perfil:", error)
      toast({
        title: "Error",
        description: `No se pudo actualizar la información del perfil: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Optional: Show a loading state for avatar upload
    // setIsAvatarUploading(true); 

    try {
      const result = await updateUserAvatar(file) // Assume result is { success: boolean, url?: string, error?: string }
      if (result.success && result.url) {
        // CORREGIDO: Usar aserción de tipo aquí
        setFormData((prev) => ({ ...prev, avatar_url: result.url as string }))
        toast({
          title: "Avatar actualizado",
          description: "Tu foto de perfil ha sido actualizada correctamente",
        })
        // Potentially update userData as well if you use it directly for display
        if (userData) {
            setUserData(prevData => prevData ? {...prevData, avatar_url: result.url as string} : null);
        }
      } else {
        throw new Error(result.error || "Error desconocido al subir avatar")
      }
    } catch (error) {
      console.error("Error al actualizar el avatar:", error)
      toast({
        title: "Error",
        description: `No se pudo actualizar la foto de perfil: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      // setIsAvatarUploading(false);
      if (e.target) e.target.value = ""; // Reset file input
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteUserAccount()
      if (result.success) {
        toast({
          title: "Cuenta eliminada",
          description: "Tu cuenta ha sido eliminada correctamente. Serás redirigido.",
        })
        // Perform logout if necessary and redirect
        // await supabase.auth.signOut(); // Example if using Supabase auth
        router.push("/login") // Or your designated logout/home page
      } else {
        throw new Error(result.error || "Error desconocido al eliminar cuenta")
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error)
      toast({
        title: "Error",
        description: `No se pudo eliminar la cuenta: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getFullName = () => {
    const { first_name, last_name } = formData;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    return first_name || last_name || "";
  }

  const getInitials = () => {
    const { first_name, last_name } = formData;
    const firstInitial = first_name?.[0] || "";
    const lastInitial = last_name?.[0] || "";
    if (firstInitial && lastInitial) return `${firstInitial}${lastInitial}`;
    if (firstInitial) return firstInitial;
    if (lastInitial) return lastInitial;
    return "U"; // Default User initial
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Actualiza tu información personal y preferencias</CardDescription>
            </div>
            <Button variant={isEditing ? "default" : "outline"} onClick={() => {
                if (isEditing) { // If was editing and now canceling
                    loadUserProfile(); // Revert changes by reloading profile
                }
                setIsEditing(!isEditing);
            }}>
              {isEditing ? (
                "Cancelar"
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24" onClick={isEditing ? handleAvatarClick : undefined} role={isEditing ? "button" : undefined} tabIndex={isEditing ? 0 : undefined} onKeyDown={isEditing ? (e) => e.key === 'Enter' && handleAvatarClick() : undefined}>
                <AvatarImage src={formData.avatar_url || undefined} alt={getFullName()} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input id="last_name" value={formData.last_name} onChange={handleInputChange} disabled={!isEditing || isSaving} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={true} // Email usually not editable directly here
                    aria-readonly="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing || isSaving}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preferencias regionales</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select
                  disabled={!isEditing || isSaving}
                  value={formData.language}
                  onValueChange={(value) => handleSelectChange("language", value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    {/* <SelectItem value="fr">Français</SelectItem> */}
                    {/* <SelectItem value="de">Deutsch</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zona horaria</Label>
                <Select
                  disabled={!isEditing || isSaving}
                  value={formData.timezone}
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Selecciona una zona horaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6/-5)</SelectItem>
                    <SelectItem value="America/New_York">Nueva York (GMT-5/-4)</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid (GMT+1/+2)</SelectItem>
                    <SelectItem value="Europe/London">Londres (GMT+0/+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_format">Formato de fecha</Label>
                <Select
                  disabled={!isEditing || isSaving}
                  value={formData.date_format}
                  onValueChange={(value) => handleSelectChange("date_format", value)}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue placeholder="Selecciona un formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); loadUserProfile(); }} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar cambios
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eliminar cuenta</CardTitle>
          <CardDescription>Eliminar tu cuenta es una acción permanente y no se puede deshacer.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Al eliminar tu cuenta, todos tus documentos y datos serán eliminados permanentemente. Esta acción no se
            puede deshacer.
          </p>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>Eliminar cuenta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus documentos, recordatorios y
                  datos personales de nuestros servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    // e.preventDefault(); // Not strictly necessary if type is "button" or handled by AlertDialog
                    handleDeleteAccount()
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sí, eliminar mi cuenta"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}