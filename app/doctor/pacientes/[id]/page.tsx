import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const sexLabels: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
}

type DoctorPatientDetailPageProps = {
  params: {
    id: string
  }
}

export default async function DoctorPatientDetailPage({ params }: DoctorPatientDetailPageProps) {
  const patient = await doctorRepo.getPatient(params.id)

  if (!patient) {
    notFound()
  }

  const [documents, prescriptions, consultations] = await Promise.all([
    doctorRepo.listSharedDocuments(),
    doctorRepo.listPrescriptions(patient.id),
    doctorRepo.listConsultations(patient.id),
  ])

  const patientDocuments = documents.filter((doc) => doc.patientId === patient.id)

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

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/15 p-6 shadow-lg shadow-emerald-500/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
              {patient.name}
            </h1>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">Resumen clínico y documentos compartidos.</p>
          </div>
          <Button
            asChild
            className="bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700"
          >
            <Link href={`/doctor/recetas/nueva?patientId=${patient.id}`}>Nueva receta</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-purple-500/15">
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-900/70 dark:text-emerald-200/70">Edad</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{patient.age} años</p>
              </div>
              <div>
                <p className="text-emerald-900/70 dark:text-emerald-200/70">Sexo</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{sexLabels[patient.sex] ?? patient.sex}</p>
              </div>
              <div>
                <p className="text-emerald-900/70 dark:text-emerald-200/70">Última visita</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {format(new Date(patient.lastVisit), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-emerald-900/70 dark:text-emerald-200/70">Condiciones</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {patient.conditions.length > 0 ? (
                    patient.conditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      >
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-300/40 bg-slate-200/30 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                    >
                      Sin condiciones
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-sky-500/10 to-purple-500/15">
            <CardHeader>
              <CardTitle>Seguimiento farmacológico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptions.length === 0 ? (
                <p className="text-sm text-rose-900/70 dark:text-rose-100/70">No hay recetas registradas.</p>
              ) : (
                prescriptions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-rose-500/20 bg-white/70 p-3 shadow-sm shadow-rose-500/15 backdrop-blur dark:border-rose-500/30 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium leading-none text-slate-900 dark:text-slate-100">{item.medication}</p>
                        <p className="text-sm text-rose-900/70 dark:text-rose-100/70">
                          {item.dosage} · {item.frequency}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200"
                      >
                        {format(new Date(item.startDate), "dd MMM yyyy")}
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-700/80 dark:text-slate-300/80">{item.notes}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-purple-500/15">
            <CardHeader>
              <CardTitle>Historial de consultas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultations.length === 0 ? (
                <p className="text-sm text-sky-900/70 dark:text-sky-100/70">No hay consultas registradas.</p>
              ) : (
                consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="rounded-lg border border-sky-500/20 bg-white/70 p-3 shadow-sm shadow-sky-500/15 backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium leading-none text-slate-900 dark:text-slate-100">
                          {format(new Date(consultation.scheduledAt), "dd MMM yyyy, HH:mm")}
                        </p>
                        <p className="text-sm text-sky-900/70 dark:text-sky-100/70">{consultation.reason}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusClasses[consultation.status] ?? "border-slate-300/40"}
                      >
                        {statusLabels[consultation.status] ?? consultation.status}
                      </Badge>
                    </div>
                    {consultation.notes && (
                      <p className="mt-2 text-sm text-slate-700/80 dark:text-slate-300/80">{consultation.notes}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <Button
                        asChild
                        size="sm"
                        className="bg-sky-600 text-white shadow-sm shadow-sky-500/30 hover:bg-sky-700"
                      >
                        <Link href={`/doctor/consultas/${consultation.id}`}>Ver detalles</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-purple-500/15">
        <CardHeader>
          <CardTitle>Documentos compartidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientDocuments.length === 0 ? (
            <p className="text-sm text-indigo-900/70 dark:text-indigo-100/70">El paciente no tiene documentos disponibles.</p>
          ) : (
            patientDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-2 rounded-lg border border-indigo-500/20 bg-white/70 p-3 shadow-sm shadow-indigo-500/15 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-indigo-500/30 dark:bg-slate-900/50"
              >
                <div>
                  <p className="font-medium leading-none text-slate-900 dark:text-slate-100">{doc.title}</p>
                  <p className="text-sm text-indigo-900/70 dark:text-indigo-100/70">
                    {doc.category} · {format(new Date(doc.uploadedAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-indigo-700 hover:bg-indigo-500/15 hover:text-indigo-800 dark:text-indigo-200"
                >
                  <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                    Ver documento
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
