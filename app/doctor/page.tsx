import Link from "next/link"
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

import { 
  getCurrentDoctorProfile, 
  getDoctorPatients, 
  getSharedDocumentsWithDoctor, 
  getDoctorPrescriptions,
  getConsultations 
} from "@/lib/doctor-service"
import { getFullName } from "@/lib/utils/profile-helpers"
import { 
  Users, 
  FileText, 
  Pill, 
  Activity, 
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Plus,
  ArrowRight,
  Bell,
  Zap,
  CheckCircle2,
  Circle
} from "lucide-react"

export default async function DoctorDashboardPage() {
  try {
    console.log('🔍 Intentando obtener perfil de doctor...')
    const doctorProfile = await getCurrentDoctorProfile()
    console.log('✅ Perfil obtenido:', doctorProfile?.id)
    
    const [patientsData, documents, prescriptions, consultations] = await Promise.all([
      getDoctorPatients(doctorProfile.id),
      getSharedDocumentsWithDoctor(doctorProfile.id),
      getDoctorPrescriptions(doctorProfile.id),
      getConsultations(doctorProfile.id),
    ])
    
    // Transform patient data to match expected structure
    const patients = patientsData.map((p: any) => ({
      id: p.patient_id,
      name: getFullName(p.patient?.profiles),
      conditions: [], // This would need to be fetched from patient medical history
    }))

  const totalPatients = patients.length
  const activePrescriptions = prescriptions.length
  const sharedDocuments = documents.length
  const chronicCases = patients.filter((patient: any) => patient.conditions.length > 0).length

  const patientNameById = new Map(patients.map((patient: any) => [patient.id, patient.name]))
  const recentDocuments = documents.slice(0, 5)
  const recentPrescriptions = prescriptions.slice(0, 5)

  const now = new Date()

  // Transform consultations to match expected structure
  const transformedConsultations = consultations.map((c: any) => ({
    id: c.id,
    patientId: c.patient_id,
    patientName: getFullName(c.patient?.profiles),
    scheduledAt: c.scheduled_at,
    status: c.status,
    reason: c.reason || 'Consulta general',
    notes: c.notes,
  }))

  const upcomingConsultations = transformedConsultations
    .filter((consultation: any) => {
      const scheduledDate = new Date(consultation.scheduledAt)
      return consultation.status === "scheduled" && scheduledDate >= now
    })
    .sort((a: any, b: any) => (a.scheduledAt > b.scheduledAt ? 1 : -1))
    .slice(0, 5)

  const historicalConsultations = transformedConsultations
    .filter((consultation: any) => {
      const scheduledDate = new Date(consultation.scheduledAt)
      return consultation.status !== "scheduled" || scheduledDate < now
    })
    .sort((a: any, b: any) => (a.scheduledAt < b.scheduledAt ? 1 : -1))

  const fallbackConsultations = [...transformedConsultations].sort((a: any, b: any) =>
    a.scheduledAt < b.scheduledAt ? 1 : -1,
  )

  const recentConsultations = (historicalConsultations.length > 0
    ? historicalConsultations
    : fallbackConsultations
  ).slice(0, 5)

  const statusLabels: Record<string, string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
  }

  const statusClasses: Record<string, string> = {
    scheduled: "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200",
    completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    cancelled: "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200",
  }

  const formatDateTime = (iso: string) => format(new Date(iso), "dd MMM yyyy, HH:mm")
  
  // ============================================
  // NUEVA ESTRUCTURA: FOCUS-DRIVEN DASHBOARD
  // ============================================
  
  // 1. SIGUIENTE ACCIÓN - Lo más urgente/importante
  const nextConsultation = upcomingConsultations[0]
  const hasUrgentAction = nextConsultation && differenceInMinutes(parseISO(nextConsultation.scheduledAt), now) < 60
  
  // 2. ACTIVIDAD DEL DÍA - Timeline de hoy
  const todayConsultations = upcomingConsultations.filter(c => 
    isToday(parseISO(c.scheduledAt))
  )
  const tomorrowConsultations = upcomingConsultations.filter(c => 
    isTomorrow(parseISO(c.scheduledAt))
  )
  
  // 3. ACCIONES RÁPIDAS - Las 4 más comunes
  const quickActions = [
    { label: "Nueva Consulta", icon: Calendar, href: "/doctor/consultas/nueva", variant: "primary" as const },
    { label: "Agregar Paciente", icon: Users, href: "/doctor/pacientes/invitar", variant: "accent" as const },
    { label: "Crear Receta", icon: Pill, href: "/doctor/recetas/nueva", variant: "info" as const },
    { label: "Ver Documentos", icon: FileText, href: "/doctor/documentos", variant: "warning" as const },
  ]
  
  // 4. ACTIVIDAD RECIENTE - Últimas acciones
  const recentActivity = [
    ...recentConsultations.slice(0, 3).map(c => ({
      type: 'consultation' as const,
      title: `Consulta con ${patientNameById.get(c.patientId) ?? 'Paciente'}`,
      time: c.scheduledAt,
      status: c.status,
    })),
    ...recentPrescriptions.slice(0, 2).map(p => ({
      type: 'prescription' as const,
      title: `Receta: ${p.medication_name}`,
      time: p.created_at,
      patient: getFullName(p.patient?.profiles),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* ===== HEADER COMPACTO ===== */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Buenos días 👋</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(now, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            {sharedDocuments > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {sharedDocuments}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ===== GRID PRINCIPAL: FOCUS + ACTIONS ===== */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_380px]">
        
        {/* COLUMNA IZQUIERDA: Focus Area */}
        <div className="space-y-6">
          
          {/* 1. TARJETA DE ENFOQUE - Lo más importante AHORA */}
          {nextConsultation ? (
            <Card className={cn(
              "relative overflow-hidden border-2 transition-all",
              hasUrgentAction 
                ? "border-warning/50 bg-gradient-to-br from-warning/10 via-warning/5 to-transparent shadow-2xl shadow-warning/20" 
                : "border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
            )}>
              {hasUrgentAction && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-warning text-white border-0 animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3 px-4 sm:px-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="font-medium">Tu próxima acción</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
                  {patientNameById.get(nextConsultation.patientId) ?? 'Paciente'}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg font-medium">
                      {format(parseISO(nextConsultation.scheduledAt), "HH:mm")}
                    </span>
                  </div>
                  <span className="text-sm">
                    {format(parseISO(nextConsultation.scheduledAt), "EEEE, d MMM", { locale: es })}
                  </span>
                </div>
                
                <p className="text-base">{nextConsultation.reason}</p>
                
                {nextConsultation.notes && (
                  <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                    {nextConsultation.notes}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button 
                    asChild 
                    size="lg" 
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-accent rounded-2xl"
                  >
                    <Link href={`/doctor/consultas/${nextConsultation.id}`}>
                      Ir a consulta
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="h-11 sm:h-12 text-sm sm:text-base rounded-2xl"
                  >
                    <Link href={`/doctor/pacientes/${nextConsultation.patientId}`}>
                      Ver historial
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
                <div className="rounded-full bg-muted/50 p-4 sm:p-6 mb-3 sm:mb-4">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-success" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">¡Todo despejado!</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  No tienes consultas programadas para hoy
                </p>
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/doctor/consultas/nueva">
                    <Plus className="mr-2 h-5 w-5" />
                    Programar consulta
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* 2. AGENDA DEL DÍA - Timeline horizontal */}
          {todayConsultations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Agenda de hoy</CardTitle>
                  <Badge variant="outline">
                    {todayConsultations.length} {todayConsultations.length === 1 ? 'consulta' : 'consultas'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayConsultations.map((consultation, index) => {
                    const isPast = new Date(consultation.scheduledAt) < now
                    const isCurrent = index === 0 && !isPast
                    
                    return (
                      <div
                        key={consultation.id}
                        className={cn(
                          "flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all",
                          isCurrent && "bg-primary/5 border-2 border-primary/20",
                          isPast && "opacity-50"
                        )}
                      >
                        <div className="flex flex-col items-center min-w-[60px] sm:min-w-[70px]">
                          <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                            {format(parseISO(consultation.scheduledAt), "HH:mm")}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs bg-primary/10 border-primary/30">
                              Ahora
                            </Badge>
                          )}
                        </div>
                        
                        <div className="h-10 sm:h-12 w-px bg-border" />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold truncate">
                            {patientNameById.get(consultation.patientId) ?? 'Paciente'}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {consultation.reason}
                          </p>
                        </div>
                        
                        <Button 
                          asChild 
                          variant={isCurrent ? "default" : "ghost"} 
                          size="sm"
                          className="rounded-xl shrink-0 text-xs sm:text-sm"
                        >
                          <Link href={`/doctor/consultas/${consultation.id}`}>
                            Ver
                          </Link>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 3. MAÑANA (si hay) */}
          {tomorrowConsultations.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mañana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tomorrowConsultations.slice(0, 3).map(consultation => (
                    <div key={consultation.id} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-muted-foreground">
                        {format(parseISO(consultation.scheduledAt), "HH:mm")}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex-1 truncate">
                        {patientNameById.get(consultation.patientId) ?? 'Paciente'}
                      </span>
                    </div>
                  ))}
                  {tomorrowConsultations.length > 3 && (
                    <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                      <Link href="/doctor/consultas">
                        Ver todas ({tomorrowConsultations.length})
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* COLUMNA DERECHA: Quick Actions + Activity */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* ACCIONES RÁPIDAS - Siempre visibles */}
          <Card className="bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 sm:px-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.href}
                    asChild
                    variant="outline"
                    className="w-full justify-start h-auto py-2.5 sm:py-3 px-3 sm:px-4 hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link href={action.href} className="flex items-center gap-2 sm:gap-3">
                      <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <span className="flex-1 text-left text-sm sm:text-base font-medium">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
          
          {/* NÚMEROS CLAVE - Compactos */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="text-center">
              <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{totalPatients}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Pacientes</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-accent">{activePrescriptions}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Recetas</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-info">{sharedDocuments}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Documentos</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-warning">{chronicCases}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Crónicos</div>
              </CardContent>
            </Card>
          </div>
          
          {/* ACTIVIDAD RECIENTE - Feed style */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-2.5 sm:space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b last:border-0 last:pb-0">
                    <div className={cn(
                      "rounded-full p-1.5 mt-0.5 shrink-0",
                      activity.type === 'consultation' ? "bg-primary/10" : "bg-accent/10"
                    )}>
                      {activity.type === 'consultation' ? (
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                      ) : (
                        <Pill className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(parseISO(activity.time), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
  } catch (error) {
    console.error('❌ Error en DoctorDashboardPage:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return (
      <div className="min-h-[400px] sm:min-h-[600px] flex items-center justify-center p-4 sm:p-8">
        <Card className="max-w-2xl w-full border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
              <div className="rounded-full bg-destructive/10 p-4 sm:p-6">
                <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">No se pudo cargar el dashboard</h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-md">
                  Parece que hubo un problema al obtener la información de tu perfil de doctor.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4 sm:p-6 w-full text-left border">
                <p className="text-xs sm:text-sm font-semibold mb-2 text-muted-foreground">Detalles del error:</p>
                <pre className="text-[10px] sm:text-xs text-destructive overflow-x-auto">
                  {error instanceof Error ? error.message : 'Error desconocido'}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl w-full sm:w-auto"
                >
                  <Link href="/doctor/configuracion">
                    Ir a configuración
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-white rounded-xl w-full sm:w-auto"
                >
                  <Link href="/">
                    Volver al inicio
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
