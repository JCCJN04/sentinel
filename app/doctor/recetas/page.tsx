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

export type DoctorPrescriptionsPageProps = {
  searchParams?: {
    q?: string
  }
}

export default async function DoctorPrescriptionsPage({ searchParams }: DoctorPrescriptionsPageProps) {
  const [prescriptions, patients] = await Promise.all([
    doctorRepo.listPrescriptions(),
    doctorRepo.listPatients(),
  ])

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.name]))
  const searchTerm = searchParams?.q?.toLowerCase().trim() ?? ""

  const filteredPrescriptions = prescriptions.filter((item) => {
    if (!searchTerm) return true
    const patientName = patientNameById.get(item.patientId) ?? ""
    const haystack = [
      patientName,
      item.medication,
      item.dosage,
      item.frequency,
      item.notes ?? "",
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(searchTerm)
  })

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-sky-500/10 to-purple-500/15 p-6 shadow-lg shadow-rose-500/15">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
              Recetas
            </h1>
            <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
              Gestiona y revisa tratamientos activos con un esquema cromático más cálido.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <SearchBar placeholder="Buscar receta..." className="sm:w-80" />
            <Button
              asChild
              className="bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700"
            >
              <Link href="/doctor/recetas/nueva">Nueva receta</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-sky-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle>Listado de recetas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead className="hidden lg:table-cell">Dosis</TableHead>
                <TableHead className="hidden lg:table-cell">Período</TableHead>
                <TableHead className="hidden xl:table-cell">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron recetas que coincidan con tu búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((item) => (
                  <TableRow
                    key={item.id}
                    className="transition-colors hover:bg-rose-500/10 dark:hover:bg-rose-500/20"
                  >
                    <TableCell className="font-medium">
                      <Link href={`/doctor/pacientes/${item.patientId}`} className="hover:underline">
                        {patientNameById.get(item.patientId) ?? item.patientId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.medication}</span>
                        <span className="text-sm text-muted-foreground">{item.frequency}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{item.dosage}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300">
                        {format(new Date(item.startDate), "dd MMM")} - {format(new Date(item.endDate), "dd MMM")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                      {item.notes ?? "Sin notas"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
