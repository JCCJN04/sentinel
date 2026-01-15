import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientDoctors } from "@/components/dashboard/patient-doctors"
import { DoctorInvitations } from "@/components/dashboard/doctor-invitations"
import { getPatientDoctors } from "@/lib/patient-doctors-service"
import { getPatientInvitations } from "@/lib/invitation-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stethoscope, Info } from "lucide-react"

export default async function DoctorsPage() {
  let doctors: any[] = []
  let invitations: any[] = []
  
  try {
    doctors = await getPatientDoctors()
  } catch (error) {
    console.error('Error loading doctors:', error)
  }
  
  try {
    invitations = await getPatientInvitations()
  } catch (error) {
    console.error('Error loading invitations:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Mis Doctores</h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona los doctores que tienen acceso a tu expediente médico
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los doctores que aparecen aquí tienen acceso a tu información médica porque aceptaste su invitación. 
          Puedes compartir documentos específicos con ellos o revocar su acceso en cualquier momento.
        </AlertDescription>
      </Alert>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <DoctorInvitations invitations={invitations} />
        </div>
      )}

      {/* Active Doctors */}
      <div>
        <PatientDoctors doctors={doctors} />
      </div>

      {/* Empty State - Only show if no doctors and no invitations */}
      {doctors.length === 0 && invitations.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No tienes doctores registrados</CardTitle>
            <CardDescription>
              Cuando un doctor te envíe una invitación, aparecerá aquí para que puedas aceptarla o rechazarla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Aún no has recibido invitaciones de doctores</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
