"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Bell, Calendar, Clock, Loader2, Mail, MessageSquare, Smartphone } from "lucide-react"
import { getUserProfile, saveNotificationPreferences, type NotificationPreferences } from "@/lib/user-service"
import { useToast } from "@/components/ui/use-toast"

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    documentReminders: true,
    expiryAlerts: true,
    paymentReminders: true,
    securityAlerts: true,
    newsletterUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    reminderFrequency: "weekly",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadNotificationPreferences()
  }, [])

  const loadNotificationPreferences = async () => {
    setIsLoading(true)
    try {
      const profile = await getUserProfile()
      if (profile && profile.notification_preferences) {
        setNotificationSettings(profile.notification_preferences)
      }
    } catch (error) {
      console.error("Error al cargar las preferencias de notificación:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleFrequencyChange = (value: "daily" | "weekly" | "monthly") => {
    setNotificationSettings((prev) => ({
      ...prev,
      reminderFrequency: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveNotificationPreferences(notificationSettings)
      if (result.success) {
        toast({
          title: "Preferencias actualizadas",
          description: "Tus preferencias de notificación han sido actualizadas correctamente",
        })
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error al guardar las preferencias:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las preferencias de notificación",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
          <CardTitle>Preferencias de notificación</CardTitle>
          <CardDescription>Configura qué notificaciones quieres recibir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tipos de notificaciones</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="documentReminders" className="flex-1">
                    Recordatorios de documentos
                    <p className="text-xs text-muted-foreground">Recibe recordatorios sobre documentos importantes</p>
                  </Label>
                </div>
                <Switch
                  id="documentReminders"
                  checked={notificationSettings.documentReminders}
                  onCheckedChange={() => handleToggle("documentReminders")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="expiryAlerts" className="flex-1">
                    Alertas de vencimiento
                    <p className="text-xs text-muted-foreground">
                      Recibe alertas cuando tus documentos estén próximos a vencer
                    </p>
                  </Label>
                </div>
                <Switch
                  id="expiryAlerts"
                  checked={notificationSettings.expiryAlerts}
                  onCheckedChange={() => handleToggle("expiryAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="paymentReminders" className="flex-1">
                    Recordatorios de pago
                    <p className="text-xs text-muted-foreground">Recibe recordatorios sobre pagos pendientes</p>
                  </Label>
                </div>
                <Switch
                  id="paymentReminders"
                  checked={notificationSettings.paymentReminders}
                  onCheckedChange={() => handleToggle("paymentReminders")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="securityAlerts" className="flex-1">
                    Alertas de seguridad
                    <p className="text-xs text-muted-foreground">
                      Recibe alertas sobre actividad sospechosa en tu cuenta
                    </p>
                  </Label>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={() => handleToggle("securityAlerts")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="newsletterUpdates" className="flex-1">
                    Actualizaciones y novedades
                    <p className="text-xs text-muted-foreground">Recibe información sobre nuevas funciones y mejoras</p>
                  </Label>
                </div>
                <Switch
                  id="newsletterUpdates"
                  checked={notificationSettings.newsletterUpdates}
                  onCheckedChange={() => handleToggle("newsletterUpdates")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Canales de notificación</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="emailNotifications" className="flex-1">
                    Correo electrónico
                  </Label>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleToggle("emailNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="pushNotifications" className="flex-1">
                    Notificaciones push
                  </Label>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={() => handleToggle("pushNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="smsNotifications" className="flex-1">
                    SMS
                    <p className="text-xs text-muted-foreground">Pueden aplicar cargos de tu operador móvil</p>
                  </Label>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={() => handleToggle("smsNotifications")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Frecuencia de recordatorios</h3>

            <RadioGroup
              value={notificationSettings.reminderFrequency}
              onValueChange={(value) => handleFrequencyChange(value as "daily" | "weekly" | "monthly")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Diario</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Semanal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Mensual</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar preferencias
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendario y sincronización</CardTitle>
          <CardDescription>Configura la sincronización con calendarios externos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              La sincronización con calendarios externos estará disponible próximamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
