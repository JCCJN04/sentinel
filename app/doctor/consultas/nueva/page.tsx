import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewConsultationForm } from "@/components/doctor/new-consultation-form"

export type DoctorNewConsultationPageProps = {
  searchParams?: {
    patientId?: string
    date?: string
  }
}

export default async function DoctorNewConsultationPage({ searchParams }: DoctorNewConsultationPageProps) {
  const patients = await doctorRepo.listPatients()

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
            Programa una consulta mock para las pruebas de interfaz con un entorno más vibrante.
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
}
