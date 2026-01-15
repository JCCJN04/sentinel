"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, Info } from "lucide-react"
import { sendPatientInvitationAction } from "@/app/doctor/pacientes/actions"

type InvitePatientFormProps = {
  doctorId: string
  doctorName: string
}

type FormState = {
  patientEmail: string
  message: string
}

export function InvitePatientForm({ doctorId, doctorName }: InvitePatientFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formState, setFormState] = useState<FormState>({
    patientEmail: "",
    message: `Hola, soy ${doctorName}. Me gustaría poder acceder a tu información médica para brindarte un mejor servicio. Por favor acepta esta invitación si estás de acuerdo.`,
  })

  const handleChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!formState.patientEmail) {
      setError("Por favor ingresa el correo electrónico del paciente.")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formState.patientEmail)) {
      setError("Por favor ingresa un correo electrónico válido.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await sendPatientInvitationAction({
        doctorId,
        patientEmail: formState.patientEmail,
        message: formState.message,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      toast({
        title: "Invitación enviada",
        description: `Se envió una invitación a ${formState.patientEmail}. El paciente debe aceptarla antes de que puedas ver su información.`,
      })

      // Reset form
      setFormState({
        patientEmail: "",
        message: `Hola, soy ${doctorName}. Me gustaría poder acceder a tu información médica para brindarte un mejor servicio. Por favor acepta esta invitación si estás de acuerdo.`,
      })

      router.refresh()
    } catch (err) {
      console.error(err)
      setError("No se pudo enviar la invitación. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema de Invitaciones:</strong> Por privacidad y seguridad, los pacientes deben autorizar explícitamente que un doctor acceda a su información. 
          La invitación será visible en el dashboard del paciente y podrá aceptarla o rechazarla.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="patientEmail">Correo Electrónico del Paciente *</Label>
          <Input
            id="patientEmail"
            type="email"
            placeholder="paciente@ejemplo.com"
            value={formState.patientEmail}
            onChange={handleChange("patientEmail")}
            disabled={isSubmitting}
            required
          />
          <p className="text-sm text-muted-foreground">
            El paciente debe tener una cuenta registrada con este correo
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="message">Mensaje de Invitación</Label>
          <Textarea
            id="message"
            placeholder="Mensaje personalizado para el paciente..."
            value={formState.message}
            onChange={handleChange("message")}
            rows={4}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">
            Este mensaje será visible para el paciente al ver la invitación
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Invitación
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
