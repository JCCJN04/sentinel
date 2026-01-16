'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, Calendar, Activity, FileText, Pill, Stethoscope, 
  Shield, Lock, Sparkles, ArrowLeft, Eye, Clock
} from "lucide-react"
import { DocumentPreviewDialog } from "@/components/doctor/document-preview-dialog"

const sexLabels: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
}

const RESOURCE_LABELS: Record<string, { icon: any, label: string, color: string }> = {
  all_documents: { icon: FileText, label: 'Documentos Médicos', color: 'text-blue-600 dark:text-blue-400' },
  all_prescriptions: { icon: Pill, label: 'Recetas Médicas', color: 'text-purple-600 dark:text-purple-400' },
  all_medications: { icon: Pill, label: 'Medicamentos Activos', color: 'text-green-600 dark:text-green-400' },
  all_allergies: { icon: Shield, label: 'Alergias', color: 'text-red-600 dark:text-red-400' },
  all_vaccines: { icon: Activity, label: 'Vacunas', color: 'text-orange-600 dark:text-orange-400' },
  all_antecedentes: { icon: FileText, label: 'Antecedentes', color: 'text-indigo-600 dark:text-indigo-400' },
  all_reports: { icon: Activity, label: 'Reportes', color: 'text-teal-600 dark:text-teal-400' },
}

type DoctorPatientDetailPageProps = {
  params: {
    id: string
  }
}

export default function DoctorPatientDetailPage({ params }: DoctorPatientDetailPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [allergies, setAllergies] = useState<any[]>([])
  const [vaccines, setVaccines] = useState<any[]>([])
  const [antecedentes, setAntecedentes] = useState<any[]>([])
  const [sharedResources, setSharedResources] = useState<any[]>([])
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    loadPatientData()
  }, [params.id])

  const loadPatientData = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/doctor/patients/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del paciente')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setPatient(data.patient)
      setDocuments(data.documents)
      setPrescriptions(data.prescriptions)
      setMedications(data.medications)
      setAllergies(data.allergies)
      setVaccines(data.vaccines)
      setAntecedentes(data.antecedentes)
      setSharedResources(data.sharedResources)
      setError(null)
    } catch (err: any) {
      console.error('Error loading patient data:', err)
      setError(err.message || 'Error al cargar datos del paciente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentClick = (doc: any) => {
    setSelectedDocument(doc)
    setPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando información del paciente...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 p-6 shadow-lg shadow-rose-500/10">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar paciente
            </h1>
            <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
              {error || 'No se pudo cargar la información del paciente. Por favor, verifica que hayas iniciado sesión como doctor.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <Link href="/doctor/pacientes">
        <Button variant="ghost" size="lg" className="gap-2 -ml-2 h-11 sm:h-9 text-base sm:text-sm">
          <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          Todos los Pacientes
        </Button>
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-2 border-blue-200/50 dark:border-blue-800/50">
        <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-black/10" />
        <div className="relative px-5 sm:px-8 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-5 sm:gap-4">
            <div className="flex items-start gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                    {patient.hasName ? patient.name : (
                      <span className="text-muted-foreground">Paciente sin nombre registrado</span>
                    )}
                  </h1>
                  <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-sm">
                    <Activity className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    Paciente Activo
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-base sm:text-sm text-muted-foreground">
                  {patient.age !== null && (
                    <span className="flex items-center gap-2 sm:gap-1.5">
                      <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
                      {patient.age} años
                    </span>
                  )}
                  {patient.sex && (
                    <span className="flex items-center gap-2 sm:gap-1.5">
                      <User className="h-5 w-5 sm:h-4 sm:w-4" />
                      {sexLabels[patient.sex] ?? patient.sex}
                    </span>
                  )}
                  <span className="flex items-center gap-2 sm:gap-1.5">
                    <Clock className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Última visita:</span>
                    <span className="sm:hidden">Visita:</span>
                    {format(new Date(patient.lastVisit), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-lg w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-medium"
            >
              <Link href={`/doctor/recetas/nueva?patientId=${patient.id}`}>
                <Pill className="h-5 w-5 sm:h-4 sm:w-4" />
                Nueva Receta
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Access Control Section */}
      {sharedResources.length > 0 && (
        <Card className="border-2 border-green-200/50 dark:border-green-800/50">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <Lock className="h-6 w-6 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-lg">Información Compartida</CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-1">
                  El paciente te ha dado acceso a {sharedResources.length} {sharedResources.length === 1 ? 'tipo de información' : 'tipos de información'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sharedResources.map((resource) => {
                const resourceInfo = RESOURCE_LABELS[resource.resource_type]
                if (!resourceInfo) return null
                
                const Icon = resourceInfo.icon
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-4 sm:p-3 rounded-lg border bg-card"
                  >
                    <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-6 w-6 sm:h-5 sm:w-5 ${resourceInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-sm font-medium truncate">{resourceInfo.label}</p>
                      <p className="text-sm sm:text-xs text-muted-foreground">
                        Desde {format(new Date(resource.shared_at), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {sharedResources.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 px-5 sm:px-6">
            <div className="text-center space-y-4 sm:space-y-3">
              <div className="mx-auto w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center">
                <Eye className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-lg sm:text-base">Acceso Limitado</p>
                <p className="text-base sm:text-sm text-muted-foreground mt-2 sm:mt-1">
                  El paciente aún no ha compartido información adicional contigo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        {/* Prescriptions Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-3">
                <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                  <Pill className="h-6 w-6 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-lg">Tratamientos Activos</CardTitle>
                  <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                    {prescriptions.length} {prescriptions.length === 1 ? 'medicamento' : 'medicamentos'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 sm:px-6">
            {prescriptions.length === 0 ? (
              <div className="text-center py-10 sm:py-8">
                <p className="text-base sm:text-sm text-muted-foreground">No hay tratamientos activos</p>
              </div>
            ) : (
              prescriptions.map((item) => (
                <div
                  key={item.id}
                  className="p-5 sm:p-4 rounded-xl border-2 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2.5 sm:space-y-2">
                      <p className="font-semibold text-base sm:text-sm">{item.medication}</p>
                      <div className="flex items-center gap-2 text-base sm:text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-sm sm:text-xs px-2.5 py-1">{item.dosage}</Badge>
                        <span>•</span>
                        <span>{item.frequency}</span>
                      </div>
                      {item.notes && (
                        <p className="text-base sm:text-sm text-muted-foreground italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-sm sm:text-xs px-2.5 py-1">
                      {format(new Date(item.startDate), "d MMM", { locale: es })}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medications, Allergies, Vaccines Grid */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        {/* Medications Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <Pill className="h-6 w-6 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-lg">Medicamentos Activos</CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                  {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 sm:px-6">
            {medications.length === 0 ? (
              <div className="text-center py-10 sm:py-8">
                <p className="text-base sm:text-sm text-muted-foreground">Sin medicamentos</p>
              </div>
            ) : (
              medications.map((med: any) => (
                <div
                  key={med.id}
                  className="p-4 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-base sm:text-sm">{med.medicine_name}</p>
                  {med.dosage && (
                    <p className="text-sm sm:text-xs text-muted-foreground mt-1.5 sm:mt-1">Dosis: {med.dosage}</p>
                  )}
                  {med.frequency_hours && (
                    <p className="text-sm sm:text-xs text-muted-foreground">Cada {med.frequency_hours}h</p>
                  )}
                  {med.prescriptions?.diagnosis && (
                    <p className="text-sm sm:text-xs text-muted-foreground mt-1.5 sm:mt-1 italic">{med.prescriptions.diagnosis}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Allergies Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Shield className="h-6 w-6 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-lg">Alergias</CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                  {allergies.length} {allergies.length === 1 ? 'alergia' : 'alergias'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 sm:px-6">
            {allergies.length === 0 ? (
              <div className="text-center py-10 sm:py-8">
                <p className="text-base sm:text-sm text-muted-foreground">Sin alergias registradas</p>
              </div>
            ) : (
              allergies.map((allergy: any) => (
                <div
                  key={allergy.id}
                  className="p-4 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-base sm:text-sm">{allergy.allergy_name}</p>
                  {allergy.reaction_description && (
                    <p className="text-sm sm:text-xs text-muted-foreground mt-1.5 sm:mt-1">{allergy.reaction_description}</p>
                  )}
                  {allergy.severity && (
                    <Badge variant="outline" className="mt-1.5 sm:mt-1 text-sm sm:text-xs px-2.5 py-1">
                      Severidad: {allergy.severity}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Vaccines Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center">
                <Activity className="h-6 w-6 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-lg">Vacunas</CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                  {vaccines.length} {vaccines.length === 1 ? 'vacuna' : 'vacunas'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 sm:px-6">
            {vaccines.length === 0 ? (
              <div className="text-center py-10 sm:py-8">
                <p className="text-base sm:text-sm text-muted-foreground">Sin vacunas registradas</p>
              </div>
            ) : (
              vaccines.map((vaccine: any) => (
                <div
                  key={vaccine.id}
                  className="p-4 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-base sm:text-sm">{vaccine.vaccine_name}</p>
                  {vaccine.administration_date && (
                    <p className="text-sm sm:text-xs text-muted-foreground mt-1.5 sm:mt-1">
                      {format(new Date(vaccine.administration_date), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                  {vaccine.dose_details && (
                    <Badge variant="secondary" className="mt-1.5 sm:mt-1 text-sm sm:text-xs px-2.5 py-1">
                      {vaccine.dose_details}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Antecedentes & Reports Grid */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        {/* Antecedentes Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <FileText className="h-6 w-6 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-lg">Antecedentes</CardTitle>
                <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                  {antecedentes.length} {antecedentes.length === 1 ? 'antecedente' : 'antecedentes'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 sm:px-6">
            {antecedentes.length === 0 ? (
              <div className="text-center py-10 sm:py-8">
                <p className="text-base sm:text-sm text-muted-foreground">Sin antecedentes registrados</p>
              </div>
            ) : (
              antecedentes.map((ant: any) => (
                <div
                  key={ant.id}
                  className="p-5 sm:p-4 rounded-xl border-2 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2.5 sm:space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-base sm:text-sm">{ant.condition_name}</p>
                        {ant.family_member && (
                          <Badge variant="secondary" className="text-sm sm:text-xs mt-1.5 sm:mt-1 px-2.5 py-1">
                            {ant.family_member}
                          </Badge>
                        )}
                        {ant.notes && (
                          <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-1">{ant.notes}</p>
                        )}
                      </div>
                      {ant.diagnosis_date && (
                        <Badge variant="outline" className="text-sm sm:text-xs px-2.5 py-1">
                          {format(new Date(ant.diagnosis_date), "MMM yyyy", { locale: es })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card className="border-2">
        <CardHeader className="space-y-3 px-5 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center gap-4 sm:gap-3">
            <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
              <FileText className="h-6 w-6 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-lg">Documentos Compartidos</CardTitle>
              <p className="text-base sm:text-sm text-muted-foreground mt-1.5 sm:mt-0.5">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-5 sm:mb-4">
                <FileText className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-lg sm:text-base">Sin documentos</p>
              <p className="text-base sm:text-sm text-muted-foreground mt-2 sm:mt-1">
                No hay documentos compartidos disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const getFileIcon = (fileType: string) => {
                  const type = fileType?.toLowerCase() || ''
                  if (type.includes('pdf')) return { icon: FileText, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' }
                  if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return { icon: FileText, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30' }
                  if (type.includes('doc')) return { icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30' }
                  return { icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/30' }
                }
                
                const { icon: Icon, color, bg } = getFileIcon(doc.fileType)
                const isPDF = doc.fileType?.toLowerCase().includes('pdf')
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
                  doc.fileType?.toLowerCase().includes(ext)
                )
                
                return (
                  <div
                    key={doc.id}
                    className="group rounded-2xl border-2 bg-card hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all overflow-hidden"
                  >
                    {/* Preview Section */}
                    <button
                      onClick={() => handleDocumentClick(doc)}
                      className="w-full cursor-pointer"
                    >
                      <div className="relative w-full h-64 sm:h-72 bg-muted/30 overflow-hidden">
                        {isImage ? (
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : isPDF ? (
                          <div className="relative w-full h-full">
                            <iframe
                              src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                              className="w-full h-full pointer-events-none"
                              title={doc.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white dark:bg-gray-900 rounded-full p-4 shadow-lg">
                                <Eye className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center space-y-3">
                              <div className={`mx-auto w-20 h-20 rounded-2xl ${bg} flex items-center justify-center`}>
                                <Icon className={`h-10 w-10 ${color}`} />
                              </div>
                              <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
                              <Badge variant="outline" className="text-xs">
                                {doc.fileType?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Info Section */}
                    <div className="p-5 sm:p-4 border-t">
                      <button
                        onClick={() => handleDocumentClick(doc)}
                        className="w-full text-left space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base sm:text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {doc.title}
                            </h4>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="secondary" className="text-sm sm:text-xs px-2.5 py-1">
                              {doc.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm sm:text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4 sm:h-3 sm:w-3" />
                          <span>{format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: es })}</span>
                          <span className="ml-auto flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Eye className="h-4 w-4 sm:h-3 sm:w-3" />
                            Click para ver detalles
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      {selectedDocument && (
        <DocumentPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          document={selectedDocument}
          patientId={patient.id}
          patientName={patient.name}
        />
      )}
    </div>
  )
}
