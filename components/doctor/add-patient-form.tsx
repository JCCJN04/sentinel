"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, Search } from "lucide-react"
import { addPatientToDoctorAction } from "@/app/doctor/pacientes/actions"

type AddPatientFormProps = {
  doctorId: string
}

type FormState = {
  patientEmail: string
  notes: string
}

export function AddPatientForm({ doctorId }: AddPatientFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [foundPatient, setFoundPatient] = useState<{ id: string; name: string; email: string } | null>(null)
  
  const [formState, setFormState] = useState<FormState>({
    patientEmail: "",
    notes: "",
  })

  const handleChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
    if (field === 'patientEmail') {
      setFoundPatient(null)
      setError(null)
    }
  }

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!formState.patientEmail) {
      setError("Por favor ingresa el correo electrónico del paciente.")
      return
    }

    setError(null)
    setIsSearching(true)

    try {
      const response = await fetch('/api/doctor/search-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formState.patientEmail }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'No se pudo buscar el paciente.')
        setFoundPatient(null)
        return
      }

      if (result.patient) {
        setFoundPatient(result.patient)
        setError(null)
      } else {
        setError('No se encontró ningún paciente con ese correo electrónico.')
        setFoundPatient(null)
      }
    } catch (err) {
      console.error(err)
      setError("Error al buscar el paciente. Intenta nuevamente.")
      setFoundPatient(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddPatient = async () => {
    if (!foundPatient) return

    setIsSubmitting(true)
    setError(null)

    try {
      await addPatientToDoctorAction({
        doctorId,
        patientId: foundPatient.id,
        notes: formState.notes,
      })

      toast({
        title: "Paciente agregado",
        description: `${foundPatient.name} fue agregado a tu lista de pacientes.`,
      })

      router.push("/doctor/pacientes")
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("No se pudo agregar el paciente. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="patientEmail">Correo Electrónico del Paciente</Label>
          <div className="flex gap-2">
            <Input
              id="patientEmail"
              type="email"
              placeholder="paciente@ejemplo.com"
              value={formState.patientEmail}
              onChange={handleChange("patientEmail")}
              disabled={isSearching || !!foundPatient}
              required
            />
            <Button
              type="submit"
              disabled={isSearching || !!foundPatient}
              variant="secondary"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {foundPatient && (
        <div className="space-y-4 border-t pt-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-semibold mb-2">Paciente encontrado:</h3>
            <p className="text-sm"><strong>Nombre:</strong> {foundPatient.name}</p>
            <p className="text-sm text-muted-foreground"><strong>Email:</strong> {foundPatient.email}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas del Paciente (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega notas sobre este paciente..."
              value={formState.notes}
              onChange={handleChange("notes")}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFoundPatient(null)
                setFormState({ patientEmail: "", notes: "" })
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddPatient}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Paciente
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
