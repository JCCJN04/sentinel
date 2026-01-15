"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserCheck, Share2, UserMinus, Stethoscope, Phone, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { revokeDoctorAccessAction } from "@/app/dashboard/doctors/actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Doctor = {
  id: string
  doctor_id: string
  status: string
  last_consultation_date: string | null
  created_at: string
  doctor_profile?: {
    specialty: string | null
    license_number: string | null
    phone_number: string | null
  }
  doctor_user?: {
    first_name: string
    last_name: string
  }
}

type PatientDoctorsProps = {
  doctors: Doctor[]
}

export function PatientDoctors({ doctors }: PatientDoctorsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  const handleRevoke = async (doctorRelationId: string) => {
    setLoading(doctorRelationId)
    setError(null)
    
    try {
      const result = await revokeDoctorAccessAction(doctorRelationId)
      
      if (result.error) {
        setError(result.error)
      } else {
        setRevokeDialogOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo revocar el acceso')
    } finally {
      setLoading(null)
    }
  }

  if (doctors.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <CardTitle>Mis Doctores</CardTitle>
          </div>
          <CardDescription>
            No tienes doctores con acceso a tu expediente médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <UserCheck className="h-4 w-4" />
            <AlertDescription>
              Cuando aceptes una invitación de un doctor, aparecerá aquí y podrás compartir documentos con él.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <CardTitle>Mis Doctores</CardTitle>
          </div>
          <Badge variant="secondary">
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctores'}
          </Badge>
        </div>
        <CardDescription>
          Doctores con acceso a tu expediente médico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {doctors.map((doctor) => {
            const doctorName = doctor.doctor_user 
              ? `Dr. ${doctor.doctor_user.first_name} ${doctor.doctor_user.last_name}`
              : 'Doctor'
            
            const specialty = doctor.doctor_profile?.specialty || 'Medicina General'
            
            return (
              <Card key={doctor.id} className="border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{doctorName}</h3>
                        <p className="text-sm text-muted-foreground">{specialty}</p>
                        {doctor.doctor_profile?.license_number && (
                          <p className="text-xs text-muted-foreground">
                            Cédula: {doctor.doctor_profile.license_number}
                          </p>
                        )}
                        {doctor.doctor_profile?.phone_number && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {doctor.doctor_profile.phone_number}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Acceso activo
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Acceso desde {format(new Date(doctor.created_at), 'dd MMM yyyy', { locale: es })}
                      {doctor.last_consultation_date && (
                        <> · Última consulta {format(new Date(doctor.last_consultation_date), 'dd MMM yyyy', { locale: es })}</>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/doctores/${doctor.doctor_id}/compartir`)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartir información
                      </Button>
                      
                      <Dialog open={revokeDialogOpen && selectedDoctor?.id === doctor.id} onOpenChange={(open) => {
                        setRevokeDialogOpen(open)
                        if (open) setSelectedDoctor(doctor)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/50 text-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Revocar acceso
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>¿Revocar acceso al doctor?</DialogTitle>
                            <DialogDescription>
                              Al revocar el acceso, el Dr. {doctorName} ya no podrá ver tu expediente médico ni documentos compartidos.
                              Esta acción se puede revertir aceptando una nueva invitación.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setRevokeDialogOpen(false)}
                              disabled={loading === doctor.id}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRevoke(doctor.id)}
                              disabled={loading === doctor.id}
                            >
                              {loading === doctor.id ? 'Revocando...' : 'Revocar acceso'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
