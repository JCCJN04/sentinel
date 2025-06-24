"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Pencil } from "lucide-react"
import { getUserProfile, updateUserProfile, updateUserAvatar, deleteUserAccount, type UserProfile } from "@/lib/user-service"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

// Interfaz del formulario, volviendo a usar first_name y last_name
interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  date_format: string;
  avatar_url: string;
}

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    language: "es",
    timezone: "America/Mexico_City",
    date_format: "DD/MM/YYYY",
    avatar_url: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter();

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const loadUserProfile = async () => {
    if(!isLoading) setIsLoading(true);
    try {
      const profile = await getUserProfile();
      if (profile) {
        const loadedData = {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          language: profile.language || "es",
          timezone: profile.timezone || "America/Mexico_City",
          date_format: profile.date_format || "DD/MM/YYYY",
          avatar_url: profile.avatar_url || "",
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: keyof Omit<ProfileFormData, 'email' | 'avatar_url' | 'first_name' | 'last_name'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
      if (initialData) {
        setFormData(initialData);
      }
      setIsEditing(false);
  }

  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true)
    try {
      // Se envían first_name y last_name, que sí existen en la DB
      const profileUpdates: Partial<UserProfile> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        language: formData.language,
        timezone: formData.timezone,
        date_format: formData.date_format,
      }
      const result = await updateUserProfile(profileUpdates)

      if (result.success) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido guardada.",
        })
        setIsEditing(false)
        await loadUserProfile()
      } else {
        throw new Error(result.error || "Ocurrió un error desconocido.")
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    setIsSaving(true);
    try {
      const result = await updateUserAvatar(file)
      if (result.success && result.url) {
        const newUrl = result.url;
        setFormData((prev) => ({ ...prev, avatar_url: newUrl }));
        setInitialData((prev) => prev ? { ...prev, avatar_url: newUrl } : null);
        toast({
          title: "Avatar actualizado",
          description: "Tu foto de perfil ha cambiado.",
        })
      } else {
        throw new Error(result.error || "No se pudo obtener la URL del avatar.")
      }
    } catch (error: any) {
      toast({
        title: "Error al subir imagen",
        description: error.message,
        variant: "destructive",
      })
    } finally {
        if (e.target) e.target.value = "";
        setIsSaving(false);
    }
  }

  const getFullName = () => `${formData.first_name} ${formData.last_name}`.trim();

  const getInitials = () => {
    const firstInitial = formData.first_name?.[0] || "";
    const lastInitial = formData.last_name?.[0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Información personal</CardTitle>
                    <CardDescription>Actualiza tu foto e información personal aquí.</CardDescription>
                </div>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                      <AvatarImage src={formData.avatar_url || undefined} alt={getFullName()} />
                      <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                      <>
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                              <Camera className="h-6 w-6 text-white" />
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} disabled={isSaving}/>
                      </>
                  )}
              </div>
              <div className="space-y-4 flex-1">
                  {/* CAMPOS SEPARADOS PARA NOMBRE Y APELLIDO */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="first_name">Nombre</Label>
                          <Input id="first_name" value={formData.first_name} onChange={handleInputChange} disabled={!isEditing || isSaving} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="last_name">Apellido</Label>
                          <Input id="last_name" value={formData.last_name} onChange={handleInputChange} disabled={!isEditing || isSaving} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="email">Correo electrónico</Label>
                          <Input id="email" type="email" value={formData.email} disabled readOnly />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} disabled={!isEditing || isSaving} placeholder="Ej. +52 8112345678" />
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
                    <Select disabled={!isEditing || isSaving} value={formData.language} onValueChange={(value) => handleSelectChange("language", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona horaria</Label>
                    <Select disabled={!isEditing || isSaving} value={formData.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                            <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                            <SelectItem value="America/New_York">Nueva York (EST)</SelectItem>
                            <SelectItem value="Europe/Madrid">Madrid (CET)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_format">Formato de fecha</Label>
                    <Select disabled={!isEditing || isSaving} value={formData.date_format} onValueChange={(value) => handleSelectChange("date_format", value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving || !isDirty}>
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar cambios
                </Button>
            </CardFooter>
        )}
      </Card>
      {/* ...el resto del componente (Eliminar Cuenta) puede permanecer igual... */}
    </div>
  )
}