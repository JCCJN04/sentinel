import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Share2, ArrowLeft, Shield, Sparkles } from "lucide-react"
import { getPatientDoctors } from "@/lib/patient-doctors-service"
import { getSharedResourcesWithDoctor } from "@/lib/shared-resources-service"
import { ShareResourcesForm } from "@/components/dashboard/share-resources-form"
import { SharedResourcesList } from "@/components/dashboard/shared-resources-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getFullName } from "@/lib/utils/profile-helpers"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ShareWithDoctorPage({ params }: PageProps) {
  const doctorId = params.id

  // Get all doctors
  const doctors = await getPatientDoctors()
  const doctor = doctors.find(d => d.doctor_id === doctorId)

  if (!doctor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Doctor no encontrado</h2>
            <p className="text-muted-foreground">
              No podemos encontrar este doctor en tu lista o no tienes acceso
            </p>
          </div>
          <Link href="/dashboard/doctores">
            <Button size="lg" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mis Doctores
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get current shares with this doctor
  const currentShares = await getSharedResourcesWithDoctor(doctorId)
  const doctorName = getFullName(doctor.first_name, doctor.last_name)

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb Navigation */}
      <Link href="/dashboard/doctores">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Mis Doctores
        </Button>
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-blue-200/50 dark:border-blue-800/50">
        <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-black/10" />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
              <Share2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Compartir con {doctorName}
                </h1>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Control Total
                </Badge>
              </div>
              <p className="text-base text-muted-foreground max-w-2xl">
                Selecciona qué información de tu expediente médico puede ver este doctor.
                Puedes modificar o revocar el acceso cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Profile Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Información del Doctor</CardTitle>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              Acceso Activo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre Completo</p>
              <p className="text-sm font-semibold">{doctorName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Especialidad</p>
              <p className="text-sm">{doctor.specialty || 'Sin especificar'}</p>
            </div>
            {doctor.license_number && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cédula Profesional</p>
                <p className="text-sm font-mono">{doctor.license_number}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Shares Section */}
      {currentShares.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <p className="text-sm font-medium text-muted-foreground">Recursos compartidos actualmente</p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <SharedResourcesList 
            doctorName={doctorName}
            shares={currentShares}
          />
        </div>
      )}

      {/* Share Form Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <p className="text-sm font-medium text-muted-foreground">Agregar nuevos recursos</p>
          <div className="h-px flex-1 bg-border" />
        </div>
        <ShareResourcesForm 
          doctorId={doctorId}
          doctorName={doctorName}
          currentShares={currentShares}
        />
      </div>
    </div>
  )
}
