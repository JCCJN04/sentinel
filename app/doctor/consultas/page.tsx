import Link from "next/link"
import { format } from "date-fns"
import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/doctor/search-bar"
import { ConsultationCalendar } from "@/components/doctor/consultation-calendar"

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
}

const statusClasses: Record<string, string> = {
  scheduled: "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

export type DoctorConsultationsPageProps = {
  searchParams?: {
    q?: string
    view?: string
  }
}

export default async function DoctorConsultationsPage({ searchParams }: DoctorConsultationsPageProps) {
  const [consultations, patients] = await Promise.all([
    doctorRepo.listConsultations(),
    doctorRepo.listPatients(),
  ])

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.name]))
  const rawQuery = searchParams?.q ?? ""
  const searchTerm = rawQuery.toLowerCase().trim()
  const viewMode = searchParams?.view === "calendar" ? "calendar" : "list"

  const filteredConsultations = consultations.filter((consultation) => {
    const patientName = patientNameById.get(consultation.patientId) ?? ""
    const haystack = [
      consultation.reason,
      consultation.notes ?? "",
      patientName,
      consultation.status,
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(searchTerm)
  })

  const calendarEvents = filteredConsultations.map((consultation) => ({
    id: consultation.id,
    scheduledAt: consultation.scheduledAt,
    patientName: patientNameById.get(consultation.patientId) ?? consultation.patientId,
    reason: consultation.reason,
    status: consultation.status,
  }))

  const sortedConsultations = filteredConsultations.sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1))

  const getViewHref = (mode: "list" | "calendar") => {
    const params = new URLSearchParams()
    if (rawQuery) params.set("q", rawQuery)
    if (mode === "calendar") {
      params.set("view", "calendar")
    }
    const query = params.toString()
    return query ? `/doctor/consultas?${query}` : "/doctor/consultas"
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-purple-500/10 p-6 shadow-lg shadow-sky-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
              Consultas
            </h1>
            <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
              Agenda y seguimiento de consultas con un panel visual más vivo.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <SearchBar placeholder="Buscar consulta..." className="sm:w-72" />
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                className={
                  viewMode === "list"
                    ? "border-sky-500 bg-sky-600 text-white hover:bg-sky-600/90"
                    : "border-sky-500/40 text-sky-700 hover:border-sky-500"
                }
              >
                <Link href={getViewHref("list")}>Listado</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className={
                  viewMode === "calendar"
                    ? "border-purple-500 bg-purple-600 text-white hover:bg-purple-600/90"
                    : "border-purple-500/40 text-purple-700 hover:border-purple-500"
                }
              >
                <Link href={getViewHref("calendar")}>Calendario</Link>
              </Button>
            </div>
            <Button
              asChild
              className="bg-purple-600 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700"
            >
              <Link href="/doctor/consultas/nueva">Nueva consulta</Link>
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-purple-500/10">
          <CardHeader>
            <CardTitle>Agenda de consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="hidden xl:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedConsultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No se encontraron consultas que coincidan con tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedConsultations.map((consultation) => (
                    <TableRow
                      key={consultation.id}
                      className="transition-colors hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
                    >
                      <TableCell className="font-medium">
                        <Link href={`/doctor/pacientes/${consultation.patientId}`} className="hover:underline">
                          {patientNameById.get(consultation.patientId) ?? consultation.patientId}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(consultation.scheduledAt), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>{consultation.reason}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {consultation.notes ?? "Sin notas"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="outline" className={statusClasses[consultation.status] ?? "border-slate-200/30"}>
                          {statusLabels[consultation.status] ?? consultation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Badge
                            variant="outline"
                            className={statusClasses[consultation.status] ?? "border-slate-200/30"}
                          >
                            {statusLabels[consultation.status] ?? consultation.status}
                          </Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/doctor/consultas/${consultation.id}`}>Ver detalles</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <ConsultationCalendar events={calendarEvents} />
      )}
    </div>
  )
}
