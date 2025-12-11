"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Heart, 
  Pill, 
  FileText, 
  Phone, 
  Droplet,
  Activity,
  Shield,
  Calendar,
  Clock,
  User,
  Syringe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface MedicalProfile {
  nombre: string
  edad?: number
  tipo_sangre?: string
  alergias: any[]
  medicamentos: any[]
  antecedentes: any[]
  condiciones_cronicas: any[]
  contacto_emergencia?: string
  vacunas: any[]
  ultima_actualizacion: string
}

export default function PerfilMedicoPublicoPage() {
  const params = useParams()
  const userId = params.id as string
  const [profile, setProfile] = useState<MedicalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Obtener información del usuario compartido
        const { data: shareData, error: shareError } = await supabase
          .from('shared_medical_profiles')
          .select('*')
          .eq('share_token', userId)
          .single()

        if (shareError) throw shareError

        const actualUserId = shareData.user_id

        // Obtener alergias
        const { data: alergiasData } = await supabase
          .from('user_allergies')
          .select('*')
          .eq('user_id', actualUserId)
          .order('created_at', { ascending: false })

        // Obtener medicamentos actuales
        const { data: medicamentosData } = await supabase
          .from('prescription_medicines')
          .select('*')
          .eq('user_id', actualUserId)
          .order('created_at', { ascending: false })

        // Obtener antecedentes
        const { data: antecedentesData } = await supabase
          .from('user_personal_history')
          .select('*')
          .eq('user_id', actualUserId)
          .order('created_at', { ascending: false })

        // Obtener vacunas
        const { data: vacunasData } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('user_id', actualUserId)
          .order('administration_date', { ascending: false })

        setProfile({
          nombre: 'Paciente',
          alergias: alergiasData || [],
          medicamentos: medicamentosData || [],
          antecedentes: antecedentesData || [],
          condiciones_cronicas: [],
          vacunas: vacunasData || [],
          ultima_actualizacion: new Date().toISOString()
        })
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('No se pudo cargar la información médica')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-emerald-600 border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Cargando información médica...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'No se encontró el perfil médico'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-cyan-50 dark:from-emerald-950/20 dark:via-background dark:to-cyan-950/20">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Perfil Médico de Emergencia</h1>
              <p className="text-sm text-muted-foreground">Información médica crítica • Solo lectura</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Información del Paciente */}
        <Card className="mb-6 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile.nombre}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {profile.edad && <span>{profile.edad} años</span>}
                    {profile.tipo_sangre && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Droplet className="h-3 w-3" />
                          Tipo {profile.tipo_sangre}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Actualizado {formatDistanceToNow(new Date(profile.ultima_actualizacion), { addSuffix: true, locale: es })}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Alertas Críticas */}
        {profile.alergias.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-900 dark:text-red-100 text-lg font-bold">
              ⚠️ ALERGIAS IMPORTANTES
            </AlertTitle>
            <AlertDescription>
              <div className="mt-3 space-y-2">
                {profile.alergias.map((alergia: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-red-900 dark:text-red-100">{alergia.nombre}</p>
                        {alergia.tipo && (
                          <Badge variant="outline" className="mt-1 text-xs border-red-300">
                            {alergia.tipo}
                          </Badge>
                        )}
                      </div>
                      {alergia.severidad && (
                        <Badge 
                          variant={alergia.severidad === 'alta' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {alergia.severidad}
                        </Badge>
                      )}
                    </div>
                    {alergia.reaccion && (
                      <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                        Reacción: {alergia.reaccion}
                      </p>
                    )}
                    {alergia.notas && (
                      <p className="text-sm text-muted-foreground mt-1">{alergia.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Medicamentos Actuales */}
          <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Pill className="h-5 w-5" />
                Medicamentos Actuales
              </CardTitle>
              <CardDescription>Medicación en curso</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {profile.medicamentos.length > 0 ? (
                <div className="space-y-3">
                  {profile.medicamentos.map((med: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">{med.nombre}</p>
                        {med.dosis && (
                          <Badge variant="outline" className="text-xs">
                            {med.dosis}
                          </Badge>
                        )}
                      </div>
                      {med.frecuencia && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Frecuencia: {med.frecuencia}
                        </p>
                      )}
                      {med.indicaciones && (
                        <p className="text-sm text-muted-foreground mt-1">{med.indicaciones}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin medicamentos registrados actualmente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Condiciones Crónicas */}
          <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/10">
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Activity className="h-5 w-5" />
                Condiciones Crónicas
              </CardTitle>
              <CardDescription>Enfermedades de largo plazo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {profile.condiciones_cronicas.length > 0 ? (
                <div className="space-y-3">
                  {profile.condiciones_cronicas.map((cond: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                      <p className="font-semibold text-purple-900 dark:text-purple-100">{cond.condicion}</p>
                      {cond.fecha && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Desde: {new Date(cond.fecha).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {cond.notas && (
                        <p className="text-sm text-muted-foreground mt-2">{cond.notas}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin condiciones crónicas registradas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Antecedentes Médicos */}
          <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <FileText className="h-5 w-5" />
                Antecedentes Médicos
              </CardTitle>
              <CardDescription>Historial médico relevante</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {profile.antecedentes.filter((a: any) => !a.es_cronico).length > 0 ? (
                <div className="space-y-3">
                  {profile.antecedentes
                    .filter((a: any) => !a.es_cronico)
                    .slice(0, 5)
                    .map((ant: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">{ant.condicion}</p>
                        {ant.fecha && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ant.fecha).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin antecedentes médicos registrados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          {profile.contacto_emergencia && (
            <Card className="border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-50/50 dark:from-rose-950/30 dark:to-rose-950/10">
                <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <Phone className="h-5 w-5" />
                  Contacto de Emergencia
                </CardTitle>
                <CardDescription>Persona a contactar en caso de emergencia</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/50 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-rose-600 dark:text-rose-400" />
                  <a 
                    href={`tel:${profile.contacto_emergencia}`}
                    className="text-2xl font-bold text-rose-900 dark:text-rose-100 hover:underline"
                  >
                    {profile.contacto_emergencia}
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toca para llamar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer con información de seguridad */}
        <Card className="mt-6 border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Información de uso médico
                </p>
                <p className="text-emerald-800 dark:text-emerald-200">
                  Esta información ha sido compartida para uso exclusivo en situaciones de emergencia o atención médica. 
                  Protegido por HealthPal.
                </p>
                <p className="text-sm text-muted-foreground">
                  Si eres el paciente y deseas actualizar esta información, ingresa a tu cuenta de HealthPal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
