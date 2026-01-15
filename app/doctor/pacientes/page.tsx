import Link from "next/link"
import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { getFullName } from "@/lib/utils/profile-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCurrentDoctorProfile, getDoctorPatients } from "@/lib/doctor-service"
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Search, 
  Plus, 
  Filter,
  Users,
  Clock,
  Activity,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

export type DoctorPatientsPageProps = {
  searchParams?: {
    q?: string
  }
}

export default async function DoctorPatientsPage({ searchParams }: DoctorPatientsPageProps) {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    const patientsData = await getDoctorPatients(doctorProfile.id)

    // Transform patient data to match expected structure
    const patients = patientsData.map((p: any) => {
      const dateOfBirth = p.patient?.profiles?.date_of_birth
      const age = dateOfBirth ? differenceInYears(new Date(), new Date(dateOfBirth)) : null
      
      return {
        id: p.patient_id,
        name: getFullName(p.patient?.profiles),
        age: age || null,
        sex: p.patient?.profiles?.sex || 'no especificado',
        email: p.patient?.profiles?.email,
        phone: p.patient?.profiles?.phone,
        lastVisit: p.last_consultation_date || new Date().toISOString(),
        conditions: [], // This would need to be fetched from patient medical history
        status: p.status || 'active',
      }
    })

  const searchTerm = searchParams?.q?.toLowerCase().trim() ?? ""

  const sortedPatients = [...patients].sort((a, b) => {
    // Ordenar por última visita (más reciente primero)
    return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  })
  
  const filteredPatients = searchTerm
    ? sortedPatients.filter((patient) => {
        const haystack = [
          patient.name,
          patient.sex,
          patient.email,
          patient.phone,
        ]
          .join(" ")
          .toLowerCase()

        return haystack.includes(searchTerm)
      })
    : sortedPatients
    
  // Estadísticas rápidas
  const stats = {
    total: patients.length,
    recentlyActive: patients.filter(p => {
      const daysSinceVisit = Math.floor((Date.now() - new Date(p.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceVisit <= 30
    }).length,
    chronic: patients.filter(p => p.conditions.length > 0).length,
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* HEADER CON ACCIONES */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pacientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}
            {searchTerm && ' encontrados'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild className="bg-gradient-to-r from-primary to-accent rounded-2xl h-10 sm:h-11 text-sm sm:text-base w-full sm:w-auto">
            <Link href="/doctor/pacientes/invitar">
              <Plus className="mr-1.5 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Agregar Paciente</span>
              <span className="xs:hidden">Agregar</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y STATS */}
      <div className="grid gap-2 sm:gap-4 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 h-10 sm:h-12 rounded-2xl text-sm sm:text-base"
            defaultValue={searchTerm}
          />
        </div>
        
        <Button variant="outline" size="lg" className="rounded-2xl h-10 sm:h-12 text-sm sm:text-base">
          <Filter className="mr-1.5 sm:mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* QUICK STATS */}
      <div className="grid gap-2 sm:gap-3 grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 text-center px-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 text-center px-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold">{stats.recentlyActive}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">30d</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
          <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 text-center px-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-warning mx-auto mb-1" />
            <div className="text-xl sm:text-2xl font-bold">{stats.chronic}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Crónicos</div>
          </CardContent>
        </Card>
      </div>

      {/* GRID DE PACIENTES - Tipo "Contactos" */}
      {filteredPatients.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <div className="rounded-full bg-muted/50 p-4 sm:p-6 mb-3 sm:mb-4">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              {searchTerm ? 'No se encontraron pacientes' : 'Aún no tienes pacientes'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm">
              {searchTerm 
                ? 'Intenta con otro término de búsqueda' 
                : 'Invita a tus primeros pacientes para comenzar'}
            </p>
            {!searchTerm && (
              <Button asChild size="lg" className="rounded-2xl h-10 sm:h-11">
                <Link href="/doctor/pacientes/invitar">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Paciente
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPatients.map((patient, index) => {
            const daysSinceVisit = Math.floor(
              (Date.now() - new Date(patient.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
            )
            const isRecentlyActive = daysSinceVisit <= 7
            
            return (
              <Link
                key={patient.id}
                href={`/doctor/pacientes/${patient.id}`}
                className="group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all hover-lift",
                  "border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
                  isRecentlyActive && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
                )}>
                  {isRecentlyActive && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                        Activo
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="pt-4 sm:pt-5 lg:pt-6 pb-4 sm:pb-5 px-3 sm:px-4 lg:px-6">
                    {/* Avatar Circle */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
                        <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                          {patient.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {patient.age ? `${patient.age} años` : 'Edad N/A'} • {patient.sex}
                        </p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                      {patient.email && (
                        <div className="flex items-center gap-2 text-muted-foreground truncate">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Visit */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {daysSinceVisit === 0 
                            ? 'Hoy' 
                            : daysSinceVisit === 1 
                            ? 'Ayer' 
                            : `Hace ${daysSinceVisit}d`}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Conditions */}
                    {patient.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
                        {patient.conditions.slice(0, 2).map((condition) => (
                          <Badge
                            key={condition}
                            variant="outline"
                            className="text-[10px] sm:text-xs border-warning/30 bg-warning/10 text-warning"
                          >
                            {condition}
                          </Badge>
                        ))}
                        {patient.conditions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{patient.conditions.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
  } catch (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 p-4 sm:p-6 shadow-lg shadow-rose-500/10">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar pacientes
            </h1>
            <p className="text-xs sm:text-sm text-rose-900/80 dark:text-rose-100/80">
              No se pudo cargar la lista de pacientes. Por favor, verifica que hayas iniciado sesión como doctor.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
