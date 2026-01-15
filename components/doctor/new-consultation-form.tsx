"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { ConsultationStatus, Patient } from "@/lib/data/doctor.repo"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createDoctorConsultation } from "@/app/doctor/consultas/actions"

export type NewConsultationFormProps = {
  patients: Patient[]
  defaultPatientId?: string
  defaultScheduledAt?: string
}

type FormState = {
  patientId: string
  scheduledAt: string
  reason: string
  status: ConsultationStatus
  notes: string
}

const toLocalInputValue = (value: Date) => {
  const local = new Date(value)
  if (Number.isNaN(local.getTime())) {
    return getNowLocalISO()
  }
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 16)
}

const getNowLocalISO = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export function NewConsultationForm({ patients, defaultPatientId, defaultScheduledAt }: NewConsultationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    patientId: defaultPatientId && patients.some((patient) => patient.id === defaultPatientId)
      ? defaultPatientId
      : patients[0]?.id ?? "",
    scheduledAt: defaultScheduledAt ? toLocalInputValue(new Date(defaultScheduledAt)) : getNowLocalISO(),
    reason: "",
    status: "scheduled",
    notes: "",
  })

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value

    setFormState((prev) => ({
      ...prev,
      [field]: field === "status" ? (value as ConsultationStatus) : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.patientId || !formState.scheduledAt || !formState.reason) {
      setError("Completa los campos obligatorios para programar la consulta.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await createDoctorConsultation({
        patientId: formState.patientId,
        scheduledAt: new Date(formState.scheduledAt).toISOString(),
        reason: formState.reason,
        status: formState.status,
        notes: formState.notes,
      })

      toast({
        title: "Consulta creada",
        description: "La consulta se registró correctamente.",
      })

      router.push("/doctor/consultas")
      router.refresh()
    } catch (submissionError) {
      console.error(submissionError)
      setError("No se pudo crear la consulta. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="patientId">Paciente</Label>
          <select
            id="patientId"
            name="patientId"
            value={formState.patientId}
            onChange={handleChange("patientId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="" disabled>
              Selecciona un paciente
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="scheduledAt">Fecha y hora</Label>
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            value={formState.scheduledAt}
            onChange={handleChange("scheduledAt")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input
            id="reason"
            name="reason"
            placeholder="Ej. Seguimiento, evaluación de síntomas"
            value={formState.reason}
            onChange={handleChange("reason")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            name="status"
            value={formState.status}
            onChange={handleChange("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="scheduled">Programada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Indicaciones adicionales, recordatorios, etc."
          value={formState.notes}
          onChange={handleChange("notes")}
          rows={4}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/doctor/consultas")} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formState.patientId}>
          {isSubmitting ? "Guardando..." : "Guardar consulta"}
        </Button>
      </div>
    </form>
  )
}
