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

export type DoctorPatientsPageProps = {
  searchParams?: {
    q?: string
  }
}

export default async function DoctorPatientsPage({ searchParams }: DoctorPatientsPageProps) {
  const patients = await doctorRepo.listPatients()

  const searchTerm = searchParams?.q?.toLowerCase().trim() ?? ""

  const sortedPatients = [...patients].sort((a, b) => a.name.localeCompare(b.name))
  const filteredPatients = searchTerm
    ? sortedPatients.filter((patient) => {
        const haystack = [
          patient.name,
          patient.sex,
          patient.conditions.join(" "),
        ]
          .join(" ")
          .toLowerCase()

        return haystack.includes(searchTerm)
      })
    : sortedPatients

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 p-6 shadow-lg shadow-emerald-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
              Pacientes
            </h1>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
              Explora tu lista de pacientes con una visual realzada por tonalidades verdes.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <SearchBar placeholder="Buscar paciente..." className="sm:w-80" />
            <Button
              asChild
              className="bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700"
            >
              <Link href="/doctor/recetas/nueva">Crear receta</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle>Pacientes activos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Edad</TableHead>
                <TableHead className="hidden md:table-cell">Sexo</TableHead>
                <TableHead className="hidden lg:table-cell">Última visita</TableHead>
                <TableHead className="hidden lg:table-cell">Condiciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron pacientes que coincidan con tu búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="transition-colors hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                  >
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{patient.age}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{patient.sex}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(patient.lastVisit), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-2">
                        {patient.conditions.length > 0 ? (
                          patient.conditions.map((condition) => (
                            <Badge
                              variant="outline"
                              key={condition}
                              className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            >
                              {condition}
                            </Badge>
                          ))
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-300/40 bg-slate-300/20 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                          >
                            Sin condiciones
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/doctor/pacientes/${patient.id}`}>Ver detalles</Link>
                      </Button>
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
