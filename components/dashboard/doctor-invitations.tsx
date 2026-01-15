"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, Clock, UserCheck, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { acceptInvitationAction, rejectInvitationAction } from "@/app/dashboard/invitations/actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Invitation = {
  id: string
  doctor_id: string
  patient_email: string
  status: string
  message: string | null
  created_at: string
  expires_at: string
  doctor_profiles?: {
    specialty: string | null
    license_number: string | null
  }
  doctor_user?: {
    first_name: string
    last_name: string
  }
}

type DoctorInvitationsProps = {
  invitations: Invitation[]
}

export function DoctorInvitations({ invitations }: DoctorInvitationsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async (invitationId: string) => {
    setLoading(invitationId)
    setError(null)
    
    try {
      const result = await acceptInvitationAction(invitationId)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo aceptar la invitación')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (invitationId: string) => {
    setLoading(invitationId)
    setError(null)
    
    try {
      const result = await rejectInvitationAction(invitationId)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo rechazar la invitación')
    } finally {
      setLoading(null)
    }
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-600" />
          <CardTitle>Invitaciones de Doctores</CardTitle>
        </div>
        <CardDescription>
          Tienes {invitations.length} {invitations.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'} de doctores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Un doctor solicita acceso a tu información médica. Revisa cuidadosamente antes de aceptar.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {invitations.map((invitation) => {
            const doctorName = invitation.doctor_user 
              ? `Dr. ${invitation.doctor_user.first_name} ${invitation.doctor_user.last_name}`
              : 'Doctor'
            
            const specialty = invitation.doctor_profiles?.specialty || 'Medicina General'
            const isExpiringSoon = new Date(invitation.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            
            return (
              <Card key={invitation.id} className="border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{doctorName}</h3>
                        <p className="text-sm text-muted-foreground">{specialty}</p>
                        {invitation.doctor_profiles?.license_number && (
                          <p className="text-xs text-muted-foreground">
                            Cédula: {invitation.doctor_profiles.license_number}
                          </p>
                        )}
                      </div>
                      <Badge variant={isExpiringSoon ? "destructive" : "secondary"}>
                        <Clock className="h-3 w-3 mr-1" />
                        Expira {format(new Date(invitation.expires_at), 'dd MMM', { locale: es })}
                      </Badge>
                    </div>

                    {invitation.message && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm italic">"{invitation.message}"</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Invitación recibida el {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={loading === invitation.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {loading === invitation.id ? 'Aceptando...' : 'Aceptar'}
                      </Button>
                      <Button
                        onClick={() => handleReject(invitation.id)}
                        disabled={loading === invitation.id}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {loading === invitation.id ? 'Rechazando...' : 'Rechazar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
