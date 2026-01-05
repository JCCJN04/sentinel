import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewPrescriptionForm } from "@/components/doctor/new-prescription-form"

export type DoctorNewPrescriptionPageProps = {
  searchParams?: {
    patientId?: string
  }
}

export default async function DoctorNewPrescriptionPage({ searchParams }: DoctorNewPrescriptionPageProps) {
  const patients = await doctorRepo.listPatients()

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-sky-500/10 to-purple-500/15 p-6 shadow-lg shadow-rose-500/15">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
            Nueva receta
          </h1>
          <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
            Crea una receta mock para tus pruebas con un entorno más dinámico.
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
}
