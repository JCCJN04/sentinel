import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewConsultationForm } from "@/components/doctor/new-consultation-form"
import { getCurrentDoctorProfile, getDoctorPatients } from "@/lib/doctor-service"
import { getFullName } from "@/lib/utils/profile-helpers"

export type DoctorNewConsultationPageProps = {
  searchParams?: {
    patientId?: string
    date?: string
  }
}

export default async function DoctorNewConsultationPage({ searchParams }: DoctorNewConsultationPageProps) {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    const patientsData = await getDoctorPatients(doctorProfile.id)
    
    const patients = patientsData.map((p: any) => ({
      id: p.patient_id,
      name: getFullName(p.patient?.profiles),
      age: 0,
      sex: p.patient?.profiles?.sex || 'no especificado',
      lastVisit: p.last_consultation_date || new Date().toISOString(),
      conditions: [],
    }))

  const scheduledFromQuery = searchParams?.date
    ? new Date(`${searchParams.date}T09:00:00`)
    : undefined

  const defaultScheduledAt = scheduledFromQuery && !Number.isNaN(scheduledFromQuery.getTime())
    ? scheduledFromQuery.toISOString()
    : undefined

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-purple-500/15 p-6 shadow-lg shadow-sky-500/15">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            Nueva consulta
          </h1>
          <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
            Programa una nueva consulta con tus pacientes.
          </p>
        </div>
      </div>

      <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle>Detalles de la consulta</CardTitle>
        </CardHeader>
        <CardContent className="bg-white/70 p-6 shadow-sm shadow-sky-500/10 backdrop-blur dark:bg-slate-900/60">
          <NewConsultationForm
            patients={patients}
            defaultPatientId={searchParams?.patientId}
            defaultScheduledAt={defaultScheduledAt}
          />
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 p-6 shadow-lg shadow-rose-500/10">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar formulario
            </h1>
            <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
              No se pudo cargar el formulario de consulta. Por favor, verifica que hayas iniciado sesión como doctor.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
