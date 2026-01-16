import { getCurrentDoctorProfile, updateDoctorProfile } from "@/lib/doctor-service"
import { DoctorSettingsForm } from "@/components/doctor/settings/doctor-settings-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DoctorSettingsPage() {
  const doctorProfile = await getCurrentDoctorProfile()

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-sky-500/10 to-emerald-500/15 p-6 shadow-lg shadow-purple-500/15">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-sm text-purple-900/80 dark:text-purple-100/80">
            Gestiona tu información personal y configuraciones del consultorio.
          </p>
        </div>
      </div>

      <DoctorSettingsForm doctorProfile={doctorProfile} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-purple-500/15">
          <CardHeader>
            <CardTitle>Preferencias de notificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow title="Alertas de laboratorio" description="Notificaciones cuando se suben nuevos resultados." status="Activado" tone="success" />
            <SettingRow title="Resúmenes semanales" description="Resumen de cambios clave en tus pacientes." status="Activado" tone="success" />
            <SettingRow title="Recordatorios de seguimiento" description="Sugerencias de citas según última visita." status="Pendiente" tone="warning" />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-sky-500/40 text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:border-sky-400/40 dark:text-sky-200"
            >
              Editar preferencias
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-purple-500/15">
          <CardHeader>
            <CardTitle>Integraciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow title="Calendario" description="Sincroniza con tu calendario para automatizar citas." status="Conectado" tone="success" />
            <SettingRow title="Notas clínicas" description="Importa notas desde tu sistema EHR." status="No conectado" tone="danger" />
            <SettingRow title="Alertas externas" description="Canales externos como SMS y WhatsApp." status="Planificado" tone="warning" />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:border-emerald-400/40 dark:text-emerald-200"
            >
              Administrar integraciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type SettingRowProps = {
  title: string
  description: string
  status: string
  tone?: "success" | "warning" | "danger"
}

const toneStyles: Record<NonNullable<SettingRowProps["tone"]>, string> = {
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  danger: "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200",
}

function SettingRow({ title, description, status, tone = "success" }: SettingRowProps) {
  const badgeClasses = toneStyles[tone]

  return (
    <div className="rounded-lg border border-white/20 bg-white/60 p-4 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-700/40 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium leading-none text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300/80">{description}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${badgeClasses}`}>
          {status}
        </Badge>
      </div>
    </div>
  )
}
