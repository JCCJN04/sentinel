"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { BellRing, CheckCircle, Clock, Plus, Loader2 } from "lucide-react"
import { documentService } from "@/lib/document-service"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
// Importar el servicio de análisis de documentos:
import { documentAnalysisService } from "@/lib/document-analysis-service"

// Interfaz para las alertas
interface Alert {
  id: string
  title: string
  document_id: string
  document_name: string
  date: string
  daysLeft: number
  priority: "alta" | "media" | "baja"
  status: "pendiente" | "completada" | "pospuesta"
  notes?: string
  created_at: string
  updated_at: string
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "alta":
      return <Badge className="bg-destructive">Alta</Badge>
    case "media":
      return <Badge className="bg-warning text-warning-foreground">Media</Badge>
    case "baja":
      return <Badge className="bg-primary">Baja</Badge>
    default:
      return <Badge>Desconocida</Badge>
  }
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [alertDates, setAlertDates] = useState<Date[]>([])
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    title: "",
    document_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    priority: "media",
    notes: "",
  })
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [creatingAlert, setCreatingAlert] = useState(false)
  const { toast } = useToast()
  // Añadir estado para alertas recomendadas:
  const [recommendedAlerts, setRecommendedAlerts] = useState<any[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(true)

  // Cargar alertas y documentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Obtener alertas
        const alertsData = await documentService.getReminders()

        // Transformar los datos para que coincidan con nuestra interfaz
        const formattedAlerts: Alert[] = alertsData.map((alert: any) => {
          const alertDate = new Date(alert.date)
          const today = new Date()
          const diffTime = alertDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          return {
            id: alert.id,
            title: alert.title,
            document_id: alert.document_id,
            document_name: alert.document?.name || "Documento no encontrado",
            date: format(alertDate, "dd/MM/yyyy"),
            daysLeft: diffDays,
            priority: alert.priority || "media",
            status: alert.status || "pendiente",
            notes: alert.notes,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
          }
        })

        setAlerts(formattedAlerts)

        // Obtener fechas para el calendario
        const dates = formattedAlerts
          .filter((alert) => alert.status === "pendiente")
          .map((alert) => {
            const [day, month, year] = alert.date.split("/")
            return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
          })

        setAlertDates(dates)

        // Obtener documentos para el selector
        const docsData = await documentService.getDocuments()
        setDocuments(docsData)
      } catch (error) {
        console.error("Error al cargar alertas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las alertas. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Añadir useEffect para cargar alertas recomendadas:
  useEffect(() => {
    const fetchRecommendedAlerts = async () => {
      try {
        setLoadingRecommended(true)
        const data = await documentAnalysisService.generateRecommendedAlerts()
        setRecommendedAlerts(data)
      } catch (error) {
        console.error("Error al cargar alertas recomendadas:", error)
      } finally {
        setLoadingRecommended(false)
      }
    }

    fetchRecommendedAlerts()
  }, [])

  // Completar una alerta
  const completeAlert = async (alertId: string) => {
    try {
      setLoadingAction(alertId)
      await documentService.updateReminder(alertId, { status: "completada" })

      // Actualizar el estado local
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) => (alert.id === alertId ? { ...alert, status: "completada" } : alert)),
      )

      toast({
        title: "Alerta completada",
        description: "La alerta ha sido marcada como completada.",
      })
    } catch (error) {
      console.error("Error al completar la alerta:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la alerta. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  // Posponer una alerta
  const postponeAlert = async (alertId: string) => {
    try {
      setLoadingAction(alertId)

      // Obtener la alerta actual
      const alert = alerts.find((a) => a.id === alertId)
      if (!alert) return

      // Calcular nueva fecha (7 días después)
      const [day, month, year] = alert.date.split("/")
      const currentDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      const newDate = addDays(currentDate, 7)

      // Actualizar en la base de datos
      await documentService.updateReminder(alertId, {
        date: format(newDate, "yyyy-MM-dd"),
        status: "pospuesta",
      })

      // Actualizar el estado local
      setAlerts((prevAlerts) =>
        prevAlerts.map((a) =>
          a.id === alertId
            ? {
                ...a,
                date: format(newDate, "dd/MM/yyyy"),
                daysLeft: a.daysLeft + 7,
                status: "pospuesta",
              }
            : a,
        ),
      )

      // Actualizar fechas del calendario
      setAlertDates((prevDates) => {
        const updatedDates = prevDates.filter((d) => !isSameDay(d, currentDate))
        updatedDates.push(newDate)
        return updatedDates
      })

      toast({
        title: "Alerta pospuesta",
        description: "La alerta ha sido pospuesta por 7 días.",
      })
    } catch (error) {
      console.error("Error al posponer la alerta:", error)
      toast({
        title: "Error",
        description: "No se pudo posponer la alerta. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  // Crear una nueva alerta
  const createAlert = async () => {
    try {
      setCreatingAlert(true)

      if (!newAlert.title || !newAlert.document_id || !newAlert.date) {
        toast({
          title: "Campos incompletos",
          description: "Por favor complete todos los campos requeridos.",
          variant: "destructive",
        })
        return
      }

      // Crear la alerta en la base de datos
      const reminderData = {
        title: newAlert.title,
        document_id: newAlert.document_id,
        date: newAlert.date,
        priority: newAlert.priority,
        notes: newAlert.notes,
        status: "pendiente",
      }

      const createdAlert = await documentService.createReminder(reminderData)

      // Formatear la alerta creada
      const alertDate = new Date(createdAlert.date)
      const today = new Date()
      const diffTime = alertDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const document = documents.find((doc) => doc.id === createdAlert.document_id)

      const newAlertFormatted: Alert = {
        id: createdAlert.id,
        title: createdAlert.title,
        document_id: createdAlert.document_id,
        document_name: document?.name || "Documento no encontrado",
        date: format(alertDate, "dd/MM/yyyy"),
        daysLeft: diffDays,
        priority: createdAlert.priority,
        status: "pendiente",
        notes: createdAlert.notes,
        created_at: createdAlert.created_at,
        updated_at: createdAlert.updated_at,
      }

      // Actualizar el estado local
      setAlerts((prevAlerts) => [newAlertFormatted, ...prevAlerts])

      // Actualizar fechas del calendario
      setAlertDates((prevDates) => [...prevDates, alertDate])

      // Cerrar el diálogo y resetear el formulario
      setIsNewAlertOpen(false)
      setNewAlert({
        title: "",
        document_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        priority: "media",
        notes: "",
      })

      toast({
        title: "Alerta creada",
        description: "La alerta ha sido creada exitosamente.",
      })
    } catch (error) {
      console.error("Error al crear la alerta:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la alerta. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCreatingAlert(false)
    }
  }

  // Verificar si una fecha tiene alertas
  const hasAlertsOnDate = (date: Date) => {
    return alertDates.some((alertDate) => isSameDay(alertDate, date))
  }

  // Renderizar el contenido de las alertas
  const renderAlerts = (status: string) => {
    const filteredAlerts = alerts.filter((alert) => alert.status === status)

    if (loading) {
      return Array(3)
        .fill(0)
        .map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                    <div className="flex items-center gap-2 mt-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
    }

    if (filteredAlerts.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay alertas {status === "pendientes" ? "pendientes" : status === "completadas" ? "completadas" : ""}
            </p>
          </CardContent>
        </Card>
      )
    }

    return filteredAlerts
      .sort((a, b) => {
        // Ordenar por días restantes para pendientes
        if (status === "pendientes") {
          return a.daysLeft - b.daysLeft
        }
        // Ordenar por fecha de actualización para completadas
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      .map((alert) => (
        <Card key={alert.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`rounded-full p-2 ${
                  alert.status === "completada"
                    ? "bg-success/10"
                    : alert.status === "pospuesta"
                      ? "bg-blue-500/10"
                      : "bg-primary/10"
                }`}
              >
                {alert.status === "completada" ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : alert.status === "pospuesta" ? (
                  <Clock className="h-5 w-5 text-blue-500" />
                ) : (
                  <BellRing className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{alert.title}</h3>
                <p className="text-sm text-muted-foreground">Documento: {alert.document_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {alert.daysLeft === 0
                      ? "Hoy"
                      : alert.daysLeft < 0
                        ? `Vencido hace ${Math.abs(alert.daysLeft)} días`
                        : `${alert.daysLeft} días`}
                  </Badge>
                  {getPriorityBadge(alert.priority)}
                  {alert.status === "pospuesta" && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 text-xs">
                      Pospuesta
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {alert.status !== "completada" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => postponeAlert(alert.id)}
                  disabled={loadingAction === alert.id}
                >
                  {loadingAction === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Posponer"}
                </Button>
                <Button size="sm" onClick={() => completeAlert(alert.id)} disabled={loadingAction === alert.id}>
                  {loadingAction === alert.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completar
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertas y recordatorios</h1>
        <p className="text-muted-foreground">Gestiona tus recordatorios y fechas importantes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Próximas alertas</h2>
            <Dialog open={isNewAlertOpen} onOpenChange={setIsNewAlertOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva alerta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva alerta</DialogTitle>
                  <DialogDescription>Complete los campos para crear una nueva alerta o recordatorio.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                      placeholder="Ej: Renovación de seguro"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="document">Documento relacionado</Label>
                    <Select
                      value={newAlert.document_id}
                      onValueChange={(value) => setNewAlert({ ...newAlert, document_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newAlert.date}
                      onChange={(e) => setNewAlert({ ...newAlert, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={newAlert.priority}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input
                      id="notes"
                      value={newAlert.notes}
                      onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                      placeholder="Notas adicionales"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewAlertOpen(false)} disabled={creatingAlert}>
                    Cancelar
                  </Button>
                  <Button onClick={createAlert} disabled={creatingAlert}>
                    {creatingAlert ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear alerta"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="pendientes" className="space-y-4">
            {/* Añadir una nueva pestaña "Recomendadas" en el TabsList: */}
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="completadas">Completadas</TabsTrigger>
              <TabsTrigger value="recomendadas">Recomendadas</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>

            <TabsContent value="pendientes" className="space-y-4">
              {renderAlerts("pendiente")}
            </TabsContent>

            <TabsContent value="completadas">
              <div className="space-y-4">{renderAlerts("completada")}</div>
            </TabsContent>

            {/* Añadir el contenido de la pestaña de alertas recomendadas: */}
            <TabsContent value="recomendadas" className="space-y-4">
              {loadingRecommended ? (
                Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-32" />
                              <div className="flex items-center gap-2 mt-1">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-12" />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-9 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : recommendedAlerts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No hay alertas recomendadas</p>
                  </CardContent>
                </Card>
              ) : (
                recommendedAlerts.map((alert, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-2 bg-warning/10">
                          <BellRing className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <h3 className="font-medium">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground">Documento: {alert.document_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {alert.daysLeft === 0
                                ? "Hoy"
                                : alert.daysLeft < 0
                                  ? `Vencido hace ${Math.abs(alert.daysLeft)} días`
                                  : `${alert.daysLeft} días`}
                            </Badge>
                            {getPriorityBadge(alert.priority)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Ignorar esta alerta recomendada
                            setRecommendedAlerts((prev) => prev.filter((_, i) => i !== index))
                          }}
                        >
                          Ignorar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Crear alerta basada en la recomendación
                            setNewAlert({
                              title: alert.title,
                              document_id: alert.document_id,
                              date: alert.date,
                              priority: alert.priority,
                              notes: "",
                            })
                            setIsNewAlertOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Crear alerta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="todas">
              <div className="space-y-4">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-32" />
                                <div className="flex items-center gap-2 mt-1">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-12" />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-9 w-20" />
                              <Skeleton className="h-9 w-24" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : alerts.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No hay alertas configuradas</p>
                    </CardContent>
                  </Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-full p-2 ${
                              alert.status === "completada"
                                ? "bg-success/10"
                                : alert.status === "pospuesta"
                                  ? "bg-blue-500/10"
                                  : "bg-primary/10"
                            }`}
                          >
                            {alert.status === "completada" ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : alert.status === "pospuesta" ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <BellRing className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground">Documento: {alert.document_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {alert.daysLeft === 0
                                  ? "Hoy"
                                  : alert.daysLeft < 0
                                    ? `Vencido hace ${Math.abs(alert.daysLeft)} días`
                                    : `${alert.daysLeft} días`}
                              </Badge>
                              {getPriorityBadge(alert.priority)}
                              {alert.status === "completada" && (
                                <Badge variant="outline" className="bg-success/10 text-success text-xs">
                                  Completada
                                </Badge>
                              )}
                              {alert.status === "pospuesta" && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 text-xs">
                                  Pospuesta
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {alert.status !== "completada" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => postponeAlert(alert.id)}
                              disabled={loadingAction === alert.id}
                            >
                              {loadingAction === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Posponer"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => completeAlert(alert.id)}
                              disabled={loadingAction === alert.id}
                            >
                              {loadingAction === alert.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Completar
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Vista de tus próximos vencimientos</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={es}
                modifiers={{
                  highlighted: (date) => hasAlertsOnDate(date),
                }}
                modifiersStyles={{
                  highlighted: {
                    backgroundColor: "hsl(var(--warning) / 0.2)",
                    color: "hsl(var(--warning))",
                    fontWeight: "bold",
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Estado de tus alertas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pendientes</span>
                    <span className="font-bold">{alerts.filter((a) => a.status === "pendiente").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completadas</span>
                    <span className="font-bold">{alerts.filter((a) => a.status === "completada").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pospuestas</span>
                    <span className="font-bold">{alerts.filter((a) => a.status === "pospuesta").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prioridad alta</span>
                    <span className="font-bold">{alerts.filter((a) => a.priority === "alta").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Para hoy</span>
                    <span className="font-bold">
                      {alerts.filter((a) => a.daysLeft === 0 && a.status === "pendiente").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Próximos 7 días</span>
                    <span className="font-bold">
                      {alerts.filter((a) => a.daysLeft <= 7 && a.daysLeft > 0 && a.status === "pendiente").length}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
