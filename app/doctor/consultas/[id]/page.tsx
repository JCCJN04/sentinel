import type { ComponentType, ReactNode, SVGProps } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { CalendarDays, Clock, FileText, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsultationAttachments } from "@/components/doctor/consultation-attachments"
import { getConsultation } from "@/lib/doctor-service"
import { getFullName } from "@/lib/utils/profile-helpers"

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

export type DoctorConsultationDetailPageProps = {
  params: {
    id: string
  }
}

export default async function DoctorConsultationDetailPage({ params }: DoctorConsultationDetailPageProps) {
  try {
    const consultationData = await getConsultation(params.id)

    if (!consultationData) {
      notFound()
    }
    
    const consultation = {
      id: consultationData.id,
      patientId: consultationData.patient_id,
      scheduledAt: consultationData.scheduled_at,
      status: consultationData.status,
      reason: consultationData.reason || 'Consulta general',
      notes: consultationData.notes,
      diagnosis: consultationData.diagnosis,
      treatmentPlan: consultationData.treatment_plan,
      followUpRequired: consultationData.follow_up_required,
      followUpDate: consultationData.follow_up_date,
      images: (consultationData.attachments || []).map(att => ({
        id: att.id,
        consultationId: att.consultation_id,
        title: att.title,
        description: att.description || undefined,
        url: att.file_url,
        uploadedAt: att.created_at,
      })),
    }

    const patient = {
      id: consultationData.patient_id,
      name: getFullName(consultationData.patient),
      age: 'N/A',
      sex: (consultationData.patient as any)?.profiles?.sex || 'no especificado',
    }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-purple-500/15 p-6 shadow-lg shadow-sky-500/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
              Consulta
            </h1>
            <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
              Detalle completo de la consulta y sus recursos asociados.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="border-sky-500/40 text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:border-sky-400/40 dark:text-sky-200"
            >
              <Link href="/doctor/consultas">Regresar</Link>
            </Button>
            <Button disabled className="cursor-not-allowed bg-purple-500/40 text-white opacity-80">
              Editar (próximamente)
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-purple-500/15">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>Información general</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusClasses[consultation.status] ?? "border-slate-200/40"}>
                {statusLabels[consultation.status] ?? consultation.status}
              </Badge>
              <span className="text-sm text-slate-700/80 dark:text-slate-200/80">
                ID: {consultation.id}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <InfoRow
                icon={User}
                label="Paciente"
                value={
                  patient ? (
                    <Link
                      href={`/doctor/pacientes/${patient.id}`}
                      className="font-medium text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {patient.name}
                    </Link>
                  ) : (
                    consultation.patientId
                  )
                }
              />
              <InfoRow
                icon={CalendarDays}
                label="Fecha"
                value={format(new Date(consultation.scheduledAt), "dd MMM yyyy")}
              />
              <InfoRow
                icon={Clock}
                label="Hora"
                value={format(new Date(consultation.scheduledAt), "HH:mm")}
              />
              <InfoRow icon={FileText} label="Motivo" value={consultation.reason} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notas</h2>
              <p className="mt-2 text-sm text-slate-700/80 dark:text-slate-300/80">
                {consultation.notes ?? "Sin notas registradas para esta consulta."}
              </p>
            </div>

            <ConsultationAttachments initialAttachments={consultation.images} />
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-purple-500/15">
          <CardHeader>
            <CardTitle>Datos del paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {patient ? (
              <>
                <div className="space-y-1">
                  <p className="text-emerald-900/70 dark:text-emerald-200/70">Nombre</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{patient.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-emerald-900/70 dark:text-emerald-200/70">Edad</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{patient.age} años</p>
                </div>
                <div className="space-y-1">
                  <p className="text-emerald-900/70 dark:text-emerald-200/70">Sexo</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{patient.sex}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-700/80 dark:text-slate-200/70">No se encontró información del paciente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 p-6 shadow-lg shadow-rose-500/10">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Error al cargar consulta
            </h1>
            <p className="text-sm text-rose-900/80 dark:text-rose-100/80">
              No se pudo cargar la información de la consulta. Por favor, verifica que hayas iniciado sesión como doctor.
            </p>
            <Button asChild variant="outline">
              <Link href="/doctor/consultas">Volver a consultas</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

type InfoRowProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 rounded-md border border-sky-500/30 bg-sky-500/10 p-2 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-slate-600 dark:text-slate-300/80">{label}</p>
        <div className="font-medium text-slate-900 dark:text-slate-100">{value}</div>
      </div>
    </div>
  )
}
