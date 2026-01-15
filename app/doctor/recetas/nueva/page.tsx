import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewPrescriptionForm } from "@/components/doctor/new-prescription-form"
import { getCurrentDoctorProfile, getDoctorPatients } from "@/lib/doctor-service"
import { getFullName } from "@/lib/utils/profile-helpers"

export type DoctorNewPrescriptionPageProps = {
  searchParams?: {
    patientId?: string
  }
}

export default async function DoctorNewPrescriptionPage({ searchParams }: DoctorNewPrescriptionPageProps) {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    const patientsData = await getDoctorPatients(doctorProfile.id)
    
    const patients = patientsData.map((p: any) => ({
      id: p.patient_id,
      name: getFullName(p.patient?.profiles),
      age: 'N/A',
      sex: p.patient?.profiles?.sex || 'no especificado',
      lastVisit: p.last_consultation_date || new Date().toISOString(),
      conditions: [],
    }))

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-sky-500/10 to-purple-500/15 p-6 shadow-lg shadow-rose-500/15">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
            Nueva receta
          </h1>
          <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
            Crea una nueva receta médica para tus pacientes.
          </p>
        </div>
      </div>

      <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-sky-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle>Detalles de la receta</CardTitle>
        </CardHeader>
        <CardContent className="bg-white/70 p-6 shadow-sm shadow-rose-500/10 backdrop-blur dark:bg-slate-900/60">
          <NewPrescriptionForm patients={patients} defaultPatientId={searchParams?.patientId} />
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
              No se pudo cargar el formulario de receta. Por favor, verifica que hayas iniciado sesión como doctor.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
