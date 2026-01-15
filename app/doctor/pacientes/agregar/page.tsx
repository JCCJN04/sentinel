import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { InvitePatientForm } from "@/components/doctor/invite-patient-form"
import { getCurrentDoctorProfile } from "@/lib/doctor-service"

export default async function InvitePatientPage() {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitar Paciente</h1>
          <p className="text-muted-foreground mt-2">
            Envía una invitación a un paciente para que autorice compartir su información contigo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Invitación</CardTitle>
            <CardDescription>
              El paciente recibirá una notificación y deberá aceptar tu invitación para que puedas ver su información médica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitePatientForm doctorId={doctorProfile.id} doctorName={doctorProfile.specialty || 'Doctor'} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    return (
      <div className="space-y-8">
        <div className="overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/20 p-8 shadow-xl shadow-rose-500/10">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar
            </h1>
            <p className="text-base text-slate-900/80 dark:text-slate-100/80">
              No se pudo cargar el formulario. Verifica que hayas iniciado sesión como doctor.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
