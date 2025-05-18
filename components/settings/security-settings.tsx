"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Check, Copy, Key, Loader2, LogOut, Shield, Smartphone, Pencil, Bell } from "lucide-react"
import {
  changeUserPassword,
  getUserSessions,
  closeSession,
  closeAllOtherSessions,
  getActivityHistory,
  signOut,
} from "@/lib/user-service"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function SecuritySettings() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isClosingSession, setIsClosingSession] = useState(false)
  const [isClosingAllSessions, setIsClosingAllSessions] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [activityHistory, setActivityHistory] = useState<any[]>([])
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadSessions()
    loadActivityHistory()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const sessions = await getUserSessions()
      setActiveSessions(sessions)
    } catch (error) {
      console.error("Error al cargar las sesiones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones activas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadActivityHistory = async () => {
    setIsLoadingActivity(true)
    try {
      const history = await getActivityHistory(10)
      setActivityHistory(history)
    } catch (error) {
      console.error("Error al cargar el historial de actividad:", error)
    } finally {
      setIsLoadingActivity(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPasswordData((prev) => ({ ...prev, [id.replace("-", "")]: value }))
  }

  const handleEnableTwoFactor = () => {
    if (twoFactorEnabled) {
      setTwoFactorEnabled(false)
      setShowTwoFactorSetup(false)
      toast({
        title: "Autenticación de dos factores desactivada",
        description: "La autenticación de dos factores ha sido desactivada correctamente",
      })
    } else {
      setShowTwoFactorSetup(true)
    }
  }

  const handleCompleteTwoFactorSetup = () => {
    setTwoFactorEnabled(true)
    setShowTwoFactorSetup(false)
    toast({
      title: "Autenticación de dos factores activada",
      description: "La autenticación de dos factores ha sido activada correctamente",
    })
  }

  const handleCopyRecoveryCodes = () => {
    // Simular la copia de códigos de recuperación
    const recoveryCodes = [
      "ABCDEF-123456",
      "GHIJKL-789012",
      "MNOPQR-345678",
      "STUVWX-901234",
      "YZABCD-567890",
      "EFGHIJ-123456",
    ].join("\n")

    navigator.clipboard.writeText(recoveryCodes).catch(() => {
      console.error("No se pudo copiar al portapapeles")
    })

    setRecoveryCodesCopied(true)
    setTimeout(() => setRecoveryCodesCopied(false), 2000)

    toast({
      title: "Códigos copiados",
      description: "Los códigos de recuperación han sido copiados al portapapeles",
    })
  }

  const handleChangePassword = async () => {
    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      })
      return
    }

    // Validar que la contraseña tenga al menos 8 caracteres
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changeUserPassword(passwordData.currentPassword, passwordData.newPassword)

      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido actualizada correctamente",
        })
        setShowChangePassword(false)
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogoutSession = async (id: string) => {
    setIsClosingSession(true)
    try {
      const result = await closeSession(id)
      if (result.success) {
        toast({
          title: "Sesión cerrada",
          description: "La sesión ha sido cerrada correctamente",
        })
        // Actualizar la lista de sesiones
        setActiveSessions(activeSessions.filter((session) => session.id !== id))
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error al cerrar la sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    } finally {
      setIsClosingSession(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    setIsClosingAllSessions(true)
    try {
      const result = await closeAllOtherSessions()
      if (result.success) {
        toast({
          title: "Sesiones cerradas",
          description: "Todas las otras sesiones han sido cerradas correctamente",
        })
        // Actualizar la lista de sesiones (solo queda la actual)
        setActiveSessions(activeSessions.filter((session) => session.current))
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error al cerrar las sesiones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cerrar las sesiones",
        variant: "destructive",
      })
    } finally {
      setIsClosingAllSessions(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        router.push("/login")
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      })
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <LogOut className="h-4 w-4 text-primary" />
      case "profile_update":
        return <Pencil className="h-4 w-4 text-primary" />
      case "security_update":
        return <Shield className="h-4 w-4 text-primary" />
      case "notification_update":
        return <Bell className="h-4 w-4 text-primary" />
      default:
        return <AlertCircle className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showChangePassword ? (
            <Button onClick={() => setShowChangePassword(true)}>
              <Key className="mr-2 h-4 w-4" />
              Cambiar contraseña
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, un número y un
                  carácter especial.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Actualizar contraseña
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Autenticación de dos factores</CardTitle>
              <CardDescription>Añade una capa adicional de seguridad a tu cuenta</CardDescription>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleEnableTwoFactor} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showTwoFactorSetup && !twoFactorEnabled && (
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Protege tu cuenta</h3>
                <p className="text-sm text-muted-foreground">
                  La autenticación de dos factores añade una capa adicional de seguridad a tu cuenta. Además de tu
                  contraseña, necesitarás ingresar un código de verificación generado por una aplicación de
                  autenticación.
                </p>
              </div>
            </div>
          )}

          {showTwoFactorSetup && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border rounded-md">
                <div className="w-48 h-48 bg-muted flex items-center justify-center">
                  <p className="text-center text-sm text-muted-foreground">
                    Código QR para configurar
                    <br />
                    la autenticación de dos factores
                  </p>
                </div>
                <p className="mt-4 text-sm text-center">
                  Escanea este código QR con tu aplicación de autenticación
                  <br />
                  (Google Authenticator, Authy, etc.)
                </p>
                <p className="mt-2 text-sm font-mono text-center">ABCDEF123456</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de verificación</Label>
                <Input id="verification-code" placeholder="Ingresa el código de 6 dígitos" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCompleteTwoFactorSetup}>Verificar y activar</Button>
              </div>
            </div>
          )}

          {twoFactorEnabled && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Autenticación de dos factores activada</h3>
                  <p className="text-sm text-muted-foreground">
                    Tu cuenta está protegida con autenticación de dos factores.
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Códigos de recuperación</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Guarda estos códigos de recuperación en un lugar seguro. Podrás usarlos para acceder a tu cuenta si
                  pierdes acceso a tu dispositivo de autenticación.
                </p>

                <div className="p-4 bg-muted rounded-md font-mono text-sm mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>ABCDEF-123456</div>
                    <div>GHIJKL-789012</div>
                    <div>MNOPQR-345678</div>
                    <div>STUVWX-901234</div>
                    <div>YZABCD-567890</div>
                    <div>EFGHIJ-123456</div>
                  </div>
                </div>

                <Button variant="outline" onClick={handleCopyRecoveryCodes}>
                  <Copy className="mr-2 h-4 w-4" />
                  {recoveryCodesCopied ? "¡Copiados!" : "Copiar códigos"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sesiones activas</CardTitle>
          <CardDescription>Gestiona las sesiones activas en tus dispositivos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeSessions.length > 0 ? (
            <>
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full p-2 bg-muted">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.current && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.location || "Ubicación desconocida"} • {session.ip_address || "IP desconocida"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Activa: {session.current ? "Ahora" : formatDate(session.last_active)}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLogoutSession(session.id)}
                      disabled={isClosingSession}
                    >
                      {isClosingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              ))}

              {activeSessions.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogoutAllSessions}
                  disabled={isClosingAllSessions}
                >
                  {isClosingAllSessions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cerrar todas las otras sesiones
                </Button>
              )}

              <Button variant="default" className="w-full" onClick={handleSignOut}>
                Cerrar sesión actual
              </Button>
            </>
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No hay sesiones activas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de actividad</CardTitle>
          <CardDescription>Revisa la actividad reciente en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activityHistory.length > 0 ? (
            <div className="space-y-4">
              {activityHistory.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-md">
                  <div className="rounded-full p-2 bg-muted">{getActivityIcon(activity.activity_type)}</div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {activity.ip_address ? `IP: ${activity.ip_address}` : "IP desconocida"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No hay actividad reciente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
