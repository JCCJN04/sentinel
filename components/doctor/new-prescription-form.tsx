"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { Patient } from "@/lib/data/doctor.repo"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createMockPrescription } from "@/app/doctor/recetas/actions"

export type NewPrescriptionFormProps = {
  patients: Patient[]
  defaultPatientId?: string
}

type FormState = {
  patientId: string
  medication: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  notes: string
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function NewPrescriptionForm({ patients, defaultPatientId }: NewPrescriptionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    patientId: defaultPatientId && patients.some((patient) => patient.id === defaultPatientId)
      ? defaultPatientId
      : patients[0]?.id ?? "",
    medication: "",
    dosage: "",
    frequency: "",
    startDate: todayISO(),
    endDate: "",
    notes: "",
  })

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.patientId || !formState.medication || !formState.dosage || !formState.frequency || !formState.startDate || !formState.endDate) {
      setError("Por favor completa todos los campos obligatorios.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await createMockPrescription({
        patientId: formState.patientId,
        medication: formState.medication,
        dosage: formState.dosage,
        frequency: formState.frequency,
        startDate: formState.startDate,
        endDate: formState.endDate,
        notes: formState.notes,
      })

      toast({
        title: "Receta creada",
        description: "La receta mock se registró correctamente.",
      })

      router.push("/doctor/recetas")
      router.refresh()
    } catch (submissionError) {
      console.error(submissionError)
      setError("No se pudo crear la receta mock. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <Label htmlFor="medication">Medicamento</Label>
          <Input
            id="medication"
            name="medication"
            placeholder="Nombre del medicamento"
            value={formState.medication}
            onChange={handleChange("medication")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dosage">Dosis</Label>
          <Input
            id="dosage"
            name="dosage"
            placeholder="Ej. 500 mg"
            value={formState.dosage}
            onChange={handleChange("dosage")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="frequency">Frecuencia</Label>
          <Input
            id="frequency"
            name="frequency"
            placeholder="Ej. Cada 8 horas"
            value={formState.frequency}
            onChange={handleChange("frequency")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startDate">Inicio</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formState.startDate}
            onChange={handleChange("startDate")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">Fin</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formState.endDate}
            onChange={handleChange("endDate")}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Detalles adicionales, recordatorios, etc."
          value={formState.notes}
          onChange={handleChange("notes")}
          rows={4}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/doctor/recetas")} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formState.patientId}>
          {isSubmitting ? "Guardando..." : "Guardar receta"}
        </Button>
      </div>
    </form>
  )
}
