import Link from "next/link"
import { format } from "date-fns"
import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DoctorDashboardPage() {
  const [patients, documents, prescriptions, consultations] = await Promise.all([
    doctorRepo.listPatients(),
    doctorRepo.listSharedDocuments(),
    doctorRepo.listPrescriptions(),
    doctorRepo.listConsultations(),
  ])

  const totalPatients = patients.length
  const activePrescriptions = prescriptions.length
  const sharedDocuments = documents.length
  const chronicCases = patients.filter((patient) => patient.conditions.length > 0).length

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.name]))
  const recentDocuments = documents.slice(0, 5)
  const recentPrescriptions = prescriptions.slice(0, 5)

  const now = new Date()

  const upcomingConsultations = consultations
    .filter((consultation) => {
      const scheduledDate = new Date(consultation.scheduledAt)
      return consultation.status === "scheduled" && scheduledDate >= now
    })
    .sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1))
    .slice(0, 5)

  const historicalConsultations = consultations
    .filter((consultation) => {
      const scheduledDate = new Date(consultation.scheduledAt)
      return consultation.status !== "scheduled" || scheduledDate < now
    })
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))

  const fallbackConsultations = [...consultations].sort((a, b) =>
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

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-purple-500/20 p-8 shadow-xl shadow-sky-500/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">
              Ritmo clínico
            </span>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Panel de control
              </h1>
              <p className="text-base text-slate-900/80 dark:text-slate-100/80">
                Resumen general de tus pacientes, consultas y documentación en un vistazo lleno de color.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-900/70 dark:text-slate-100/70">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/50 px-3 py-1 shadow-sm shadow-sky-500/10 dark:border-slate-700/60 dark:bg-slate-900/50">
                {totalPatients} pacientes activos
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/40 px-3 py-1 shadow-sm shadow-purple-500/10 dark:border-slate-700/50 dark:bg-slate-900/50">
                {activePrescriptions} recetas en curso
              </span>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700"
          >
            <Link href="/doctor/consultas/nueva">Nueva consulta</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/15 via-sky-400/10 to-sky-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sky-900/80 dark:text-sky-100/80">Pacientes activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-sky-900 dark:text-sky-100">{totalPatients}</p>
            <p className="text-sm text-sky-900/70 dark:text-sky-200/70">Pacientes asignados actualmente</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-emerald-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/80 dark:text-emerald-100/80">Recetas activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-emerald-900 dark:text-emerald-100">{activePrescriptions}</p>
            <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70">Recetas en seguimiento</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-indigo-400/10 to-indigo-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900/80 dark:text-indigo-100/80">Documentos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-indigo-900 dark:text-indigo-100">{sharedDocuments}</p>
            <p className="text-sm text-indigo-900/70 dark:text-indigo-200/70">Elementos en la bandeja de entrada</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900/80 dark:text-amber-100/80">Casos crónicos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-amber-900 dark:text-amber-100">{chronicCases}</p>
            <p className="text-sm text-amber-900/70 dark:text-amber-200/70">Pacientes con condiciones registradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="grid gap-6">
          <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-purple-500/15">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Consultas próximas</CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:text-sky-200"
                >
                  <Link href="/doctor/consultas">Ver todas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingConsultations.length === 0 ? (
                <p className="text-sm text-sky-900/70 dark:text-sky-100/70">No hay consultas programadas.</p>
              ) : (
                upcomingConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="space-y-3 rounded-xl border border-sky-500/20 bg-white/70 p-3 shadow-sm shadow-sky-500/10 backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium leading-none text-slate-900 dark:text-slate-100">
                          {patientNameById.get(consultation.patientId) ?? consultation.patientId}
                        </p>
                        <p className="text-sm text-sky-900/70 dark:text-sky-100/70">
                          {formatDateTime(consultation.scheduledAt)} · {consultation.reason}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusClasses[consultation.status] ?? "border-slate-200/40"}>
                        {statusLabels[consultation.status] ?? consultation.status}
                      </Badge>
                    </div>
                    {consultation.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-300/80">{consultation.notes}</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        asChild
                        size="sm"
                        className="bg-sky-600 text-white shadow-sm shadow-sky-500/30 hover:bg-sky-700"
                      >
                        <Link href={`/doctor/consultas/${consultation.id}`}>Ver consulta</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/15 via-sky-500/10 to-indigo-500/15">
            <CardHeader>
              <CardTitle>Últimas consultas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentConsultations.length === 0 ? (
                <p className="text-sm text-purple-900/70 dark:text-purple-100/70">Sin historial de consultas registrado.</p>
              ) : (
                recentConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="space-y-3 rounded-xl border border-purple-500/20 bg-white/70 p-3 shadow-sm shadow-purple-500/10 backdrop-blur dark:border-purple-500/30 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium leading-none text-slate-900 dark:text-slate-100">
                          {patientNameById.get(consultation.patientId) ?? consultation.patientId}
                        </p>
                        <p className="text-sm text-purple-900/70 dark:text-purple-100/70">
                          {formatDateTime(consultation.scheduledAt)} · {consultation.reason}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusClasses[consultation.status] ?? "border-slate-200/40"}>
                        {statusLabels[consultation.status] ?? consultation.status}
                      </Badge>
                    </div>
                    {consultation.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-300/80">{consultation.notes}</p>
                    )}
                    <div className="flex justify-end">
                      <Button asChild variant="ghost" size="sm" className="text-purple-700 hover:bg-purple-500/15 hover:text-purple-800 dark:text-purple-200">
                        <Link href={`/doctor/consultas/${consultation.id}`}>Ver consulta</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-purple-500/15">
            <CardHeader>
              <CardTitle>Documentos compartidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="space-y-1 rounded-lg border border-indigo-500/20 bg-white/70 p-3 shadow-sm shadow-indigo-500/15 backdrop-blur dark:border-indigo-500/30 dark:bg-slate-900/50"
                >
                  <p className="font-medium leading-none text-slate-900 dark:text-slate-100">{doc.title}</p>
                  <p className="text-sm text-indigo-900/70 dark:text-indigo-100/70">
                    {format(new Date(doc.uploadedAt), "dd MMM yyyy, HH:mm")} · {doc.category}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-sky-500/10 to-purple-500/15">
            <CardHeader>
              <CardTitle>Recetas recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPrescriptions.map((item) => (
                <div
                  key={item.id}
                  className="space-y-1 rounded-lg border border-rose-500/20 bg-white/70 p-3 shadow-sm shadow-rose-500/15 backdrop-blur dark:border-rose-500/30 dark:bg-slate-900/50"
                >
                  <p className="font-medium leading-none text-slate-900 dark:text-slate-100">{item.medication}</p>
                  <p className="text-sm text-rose-900/70 dark:text-rose-100/70">
                    Paciente {item.patientId} · {item.dosage} · {item.frequency}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
