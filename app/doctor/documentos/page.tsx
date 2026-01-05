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

export type DoctorDocumentsPageProps = {
  searchParams?: {
    q?: string
  }
}

export default async function DoctorDocumentsPage({ searchParams }: DoctorDocumentsPageProps) {
  const [documents, patients] = await Promise.all([
    doctorRepo.listSharedDocuments(),
    doctorRepo.listPatients(),
  ])

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.name]))
  const searchTerm = searchParams?.q?.toLowerCase().trim() ?? ""

  const filteredDocuments = searchTerm
    ? documents.filter((doc) => {
        const patientName = patientNameById.get(doc.patientId) ?? ""
        const haystack = [doc.title, doc.category, patientName].join(" ").toLowerCase()
        return haystack.includes(searchTerm)
      })
    : documents

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-purple-500/15 p-6 shadow-lg shadow-indigo-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-500 bg-clip-text text-transparent">
              Documentos
            </h1>
            <p className="text-sm text-indigo-900/80 dark:text-indigo-100/80">
              Revisa los envíos más recientes con una interfaz más vibrante.
            </p>
          </div>
          <SearchBar placeholder="Buscar documento..." className="sm:w-80" />
        </div>
      </div>

      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-purple-500/10">
        <CardHeader>
          <CardTitle>Bandeja de documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Paciente</TableHead>
                <TableHead className="hidden lg:table-cell">Categoría</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron documentos que coincidan con tu búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="transition-colors hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
                  >
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {patientNameById.get(doc.patientId) ?? doc.patientId}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(doc.uploadedAt), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                          Abrir
                        </Link>
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
