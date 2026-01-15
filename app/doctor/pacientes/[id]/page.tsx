import Link from "next/link"
import { notFound } from "next/navigation"
import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, Calendar, Activity, FileText, Pill, Stethoscope, 
  Shield, Lock, Sparkles, ArrowLeft, Eye, Clock
} from "lucide-react"
import { getDoctorPatients, getSharedDocumentsWithDoctor, getDoctorPrescriptions, getCurrentDoctorProfile } from "@/lib/doctor-service"
import { 
  getDoctorSharedResources, 
  getDoctorAccessiblePrescriptions, 
  getDoctorAccessibleDocuments,
  getDoctorAccessibleMedications,
  getDoctorAccessibleAllergies,
  getDoctorAccessibleVaccines,
  getDoctorAccessibleAntecedentes
} from "@/lib/shared-resources-service"
import { getFullName } from "@/lib/utils/profile-helpers"

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

export default async function DoctorPatientDetailPage({ params }: DoctorPatientDetailPageProps) {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    const patientsData = await getDoctorPatients(doctorProfile.id)
    
    const patientData = patientsData.find((p: any) => p.patient_id === params.id)
    
    if (!patientData) {
      notFound()
    }
    
    const dateOfBirth = patientData.patient?.profiles?.date_of_birth
    const age = dateOfBirth ? differenceInYears(new Date(), new Date(dateOfBirth)) : null
    
    const patient = {
      id: patientData.patient_id,
      name: getFullName(patientData.patient?.profiles),
      age: age || 'N/A',
      sex: patientData.patient?.profiles?.sex || 'no especificado',
      lastVisit: patientData.last_consultation_date || new Date().toISOString(),
      conditions: [],
    }

    const [sharedResources, documentsData, prescriptionsData, medications, allergies, vaccines, antecedentes] = await Promise.all([
      getDoctorSharedResources(params.id).catch(() => []),
      getDoctorAccessibleDocuments(params.id).catch(() => []),
      getDoctorAccessiblePrescriptions(params.id).catch(() => []),
      getDoctorAccessibleMedications(params.id).catch(() => []),
      getDoctorAccessibleAllergies(params.id).catch(() => []),
      getDoctorAccessibleVaccines(params.id).catch(() => []),
      getDoctorAccessibleAntecedentes(params.id).catch(() => []),
    ])
    
    const documents = documentsData.map((d: any) => ({
      id: d.id,
      title: d.title || 'Sin título',
      category: d.category || 'General',
      uploadedAt: d.uploaded_at,
      url: d.file_path || '#',
    }))
    
    const prescriptions = prescriptionsData.map((p: any) => ({
      id: p.id,
      medication: p.medicine_name || 'Medicamento',
      dosage: p.dosage || 'N/A',
      frequency: p.frequency_hours ? `Cada ${p.frequency_hours}h` : 'N/A',
      startDate: p.prescriptions?.start_date || p.created_at,
      endDate: p.prescriptions?.end_date,
      notes: p.instructions,
    }))

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <Link href="/doctor/pacientes">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Todos los Pacientes
        </Button>
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-2 border-blue-200/50 dark:border-blue-800/50">
        <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-black/10" />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {patient.name}
                  </h1>
                  <Badge variant="secondary" className="gap-1">
                    <Activity className="h-3 w-3" />
                    Paciente Activo
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {patient.age} años
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {sexLabels[patient.sex] ?? patient.sex}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Última visita: {format(new Date(patient.lastVisit), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-lg"
            >
              <Link href={`/doctor/recetas/nueva?patientId=${patient.id}`}>
                <Pill className="h-4 w-4" />
                Nueva Receta
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Access Control Section */}
      {sharedResources.length > 0 && (
        <Card className="border-2 border-green-200/50 dark:border-green-800/50">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Información Compartida</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  El paciente te ha dado acceso a {sharedResources.length} {sharedResources.length === 1 ? 'tipo de información' : 'tipos de información'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sharedResources.map((resource) => {
                const resourceInfo = RESOURCE_LABELS[resource.resource_type]
                if (!resourceInfo) return null
                
                const Icon = resourceInfo.icon
                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-5 w-5 ${resourceInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resourceInfo.label}</p>
                      <p className="text-xs text-muted-foreground">
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
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Acceso Limitado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El paciente aún no ha compartido información adicional contigo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prescriptions Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Tratamientos Activos</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {prescriptions.length} {prescriptions.length === 1 ? 'medicamento' : 'medicamentos'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No hay tratamientos activos</p>
              </div>
            ) : (
              prescriptions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border-2 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">{item.medication}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline">{item.dosage}</Badge>
                        <span>•</span>
                        <span>{item.frequency}</span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Medications Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Medicamentos Activos</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {medications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sin medicamentos</p>
              </div>
            ) : (
              medications.map((med: any) => (
                <div
                  key={med.id}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-sm">{med.medicine_name}</p>
                  {med.dosage && (
                    <p className="text-xs text-muted-foreground mt-1">Dosis: {med.dosage}</p>
                  )}
                  {med.frequency_hours && (
                    <p className="text-xs text-muted-foreground">Cada {med.frequency_hours}h</p>
                  )}
                  {med.prescriptions?.diagnosis && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{med.prescriptions.diagnosis}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Allergies Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Alergias</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {allergies.length} {allergies.length === 1 ? 'alergia' : 'alergias'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allergies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sin alergias registradas</p>
              </div>
            ) : (
              allergies.map((allergy: any) => (
                <div
                  key={allergy.id}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-sm">{allergy.allergy_name}</p>
                  {allergy.reaction_description && (
                    <p className="text-xs text-muted-foreground mt-1">{allergy.reaction_description}</p>
                  )}
                  {allergy.severity && (
                    <Badge variant="outline" className="mt-1 text-xs">
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
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle>Vacunas</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {vaccines.length} {vaccines.length === 1 ? 'vacuna' : 'vacunas'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {vaccines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sin vacunas registradas</p>
              </div>
            ) : (
              vaccines.map((vaccine: any) => (
                <div
                  key={vaccine.id}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-sm">{vaccine.vaccine_name}</p>
                  {vaccine.administration_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(vaccine.administration_date), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                  {vaccine.dose_details && (
                    <Badge variant="secondary" className="mt-1 text-xs">
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Antecedentes Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Antecedentes</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {antecedentes.length} {antecedentes.length === 1 ? 'antecedente' : 'antecedentes'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {antecedentes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Sin antecedentes registrados</p>
              </div>
            ) : (
              antecedentes.map((ant: any) => (
                <div
                  key={ant.id}
                  className="p-4 rounded-xl border-2 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ant.condition_name}</p>
                        {ant.family_member && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {ant.family_member}
                          </Badge>
                        )}
                        {ant.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{ant.notes}</p>
                        )}
                      </div>
                      {ant.diagnosis_date && (
                        <Badge variant="outline" className="text-xs">
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
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle>Documentos Compartidos</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">Sin documentos</p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay documentos compartidos disponibles
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border-2 bg-card hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {doc.category}
                      </Badge>
                      <span>•</span>
                      <span>{format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 p-6 shadow-lg shadow-rose-500/10">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar paciente
            </h1>
            <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
              No se pudo cargar la información del paciente. Por favor, verifica que hayas iniciado sesión como doctor.
            </p>
            <Button asChild variant="outline">
              <Link href="/doctor/pacientes">Volver a pacientes</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
