"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserProfile {
  first_name: string
  last_name: string
  tipo_de_sangre?: string
  phone?: string
  contacto_emergencia?: any
}

interface SharedProfileConfig {
  includes_allergies: boolean
  includes_prescriptions: boolean
  includes_personal_history: boolean
  includes_vaccinations: boolean
  user_id: string
}

interface MedicalProfile {
  profile: UserProfile
  allergies: any[]
  prescriptions: any[]
  personalHistory: any[]
  familyHistory: any[]
  vaccinations: any[]
  sharedConfig: SharedProfileConfig
}

export default function PerfilMedicoPublicoPage() {
  const params = useParams()
  const shareToken = params.id as string
  const [data, setData] = useState<MedicalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cliente de Supabase público (sin autenticación requerida)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔍 Buscando perfil compartido con token:', shareToken)
        
        // 1. Buscar la configuración de perfil compartido
        const { data: sharedConfig, error: sharedError } = await supabase
          .from('shared_profiles')
          .select('*')
          .eq('share_token', shareToken)
          .eq('is_active', true)
          .maybeSingle()

        if (sharedError) {
          console.error('❌ Error buscando shared_profiles:', sharedError)
          throw new Error('Enlace inválido o expirado')
        }

        if (!sharedConfig) {
          console.log('⚠️ No se encontró configuración de compartir')
          throw new Error('Este enlace no existe o ha expirado')
        }

        // Verificar expiración
        if (sharedConfig.expires_at && new Date(sharedConfig.expires_at) < new Date()) {
          throw new Error('Este enlace ha expirado')
        }

        console.log('✅ Configuración encontrada:', sharedConfig)
        const userId = sharedConfig.user_id

        // 2. Obtener perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, tipo_de_sangre, phone, contacto_emergencia')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          console.error('❌ Error obteniendo perfil:', profileError)
        }

        console.log('👤 Perfil obtenido:', profileData)

        // 3. Obtener alergias (si está habilitado)
        let allergies: any[] = []
        if (sharedConfig.includes_allergies) {
          const { data: allergiesData, error: allergiesError } = await supabase
            .from('user_allergies')
            .select('*')
            .eq('user_id', userId)

          if (allergiesError) {
            console.error('❌ Error obteniendo alergias:', allergiesError)
          } else {
            allergies = allergiesData || []
            console.log('💊 Alergias obtenidas:', allergies.length)
          }
        }

        // 4. Obtener prescripciones con medicamentos (si está habilitado)
        let prescriptions: any[] = []
        if (sharedConfig.includes_prescriptions) {
          const { data: prescData, error: prescError } = await supabase
            .from('prescriptions')
            .select(`
              *,
              medicines:prescription_medicines(*)
            `)
            .eq('user_id', userId)

          if (prescError) {
            console.error('❌ Error obteniendo prescripciones:', prescError)
          } else {
            prescriptions = prescData || []
            console.log('💊 Prescripciones obtenidas:', prescriptions.length)
          }
        }

        // 5. Obtener historial personal (si está habilitado)
        let personalHistory: any[] = []
        let familyHistory: any[] = []
        if (sharedConfig.includes_personal_history) {
          const { data: personalData, error: personalError } = await supabase
            .from('user_personal_history')
            .select('*')
            .eq('user_id', userId)

          if (personalError) {
            console.error('❌ Error obteniendo historial personal:', personalError)
          } else {
            personalHistory = personalData || []
            console.log('📋 Historial personal obtenido:', personalHistory.length)
          }

          // También obtener historial familiar
          const { data: familyData, error: familyError } = await supabase
            .from('user_family_history')
            .select('*')
            .eq('user_id', userId)

          if (familyError) {
            console.error('❌ Error obteniendo historial familiar:', familyError)
          } else {
            familyHistory = familyData || []
            console.log('👨‍👩‍👧‍👦 Historial familiar obtenido:', familyHistory.length)
          }
        }

        // 6. Obtener vacunas (si está habilitado)
        let vaccinations: any[] = []
        if (sharedConfig.includes_vaccinations) {
          const { data: vaccData, error: vaccError } = await supabase
            .from('vaccinations')
            .select('*')
            .eq('user_id', userId)

          if (vaccError) {
            console.error('❌ Error obteniendo vacunas:', vaccError)
          } else {
            vaccinations = vaccData || []
            console.log('💉 Vacunas obtenidas:', vaccinations.length)
          }
        }

        // 7. Construir el objeto final
        const medicalProfile: MedicalProfile = {
          profile: profileData || { first_name: 'Usuario', last_name: '' },
          allergies,
          prescriptions,
          personalHistory,
          familyHistory,
          vaccinations,
          sharedConfig
        }

        console.log('✅ Perfil médico completo:', medicalProfile)
        setData(medicalProfile)

      } catch (err: any) {
        console.error('❌ Error general:', err)
        setError(err.message || 'No se pudo cargar la información médica')
      } finally {
        setLoading(false)
      }
    }

    if (shareToken) {
      fetchProfile()
    }
  }, [shareToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil médico...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || 'No se pudo cargar la información médica'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, allergies, prescriptions, personalHistory, familyHistory, vaccinations, sharedConfig } = data
  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || 'Usuario'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Perfil Médico</h1>
              <p className="text-sm text-gray-500">Información compartida de forma segura</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Información Personal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="text-lg font-semibold text-gray-900">{fullName}</p>
            </div>
            
            {profile.tipo_de_sangre && (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Sangre</p>
                  <Badge variant="outline" className="mt-1">{profile.tipo_de_sangre}</Badge>
                </div>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}

            {profile.contacto_emergencia && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-semibold text-gray-700">Contacto de Emergencia</p>
                </div>
                {profile.contacto_emergencia.nombre && (
                  <p className="text-sm text-gray-900">{profile.contacto_emergencia.nombre}</p>
                )}
                {profile.contacto_emergencia.telefono && (
                  <p className="text-sm text-gray-600">{profile.contacto_emergencia.telefono}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alergias */}
        {sharedConfig.includes_allergies && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle>Alergias</CardTitle>
                </div>
                <Badge variant="secondary">{allergies.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {allergies.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin alergias registradas</p>
              ) : (
                <div className="space-y-3">
                  {allergies.map((allergy) => (
                    <Alert key={allergy.id} className="border-red-200 bg-red-50">
                      <AlertTitle className="font-semibold text-red-900 flex items-center gap-2">
                        {allergy.allergy_name}
                        {allergy.severity && (
                          <Badge variant={allergy.severity === 'grave' ? 'destructive' : 'outline'}>
                            {allergy.severity}
                          </Badge>
                        )}
                      </AlertTitle>
                      {allergy.reaction_description && (
                        <AlertDescription className="text-red-800 mt-1">
                          {allergy.reaction_description}
                        </AlertDescription>
                      )}
                      {allergy.treatment && (
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Tratamiento:</strong> {allergy.treatment}
                        </p>
                      )}
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Medicamentos Actuales */}
        {sharedConfig.includes_prescriptions && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <CardTitle>Medicamentos Actuales</CardTitle>
                </div>
                <Badge variant="secondary">{prescriptions.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin medicamentos registrados</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{prescription.diagnosis}</p>
                          {prescription.doctor_name && (
                            <p className="text-sm text-gray-600">Dr. {prescription.doctor_name}</p>
                          )}
                        </div>
                        {prescription.start_date && (
                          <Badge variant="outline">
                            {format(new Date(prescription.start_date), 'dd MMM yyyy', { locale: es })}
                          </Badge>
                        )}
                      </div>
                      
                      {prescription.medicines && prescription.medicines.length > 0 && (
                        <div className="bg-blue-50 rounded p-3 space-y-2">
                          {prescription.medicines.map((med: any) => (
                            <div key={med.id} className="flex items-start gap-2">
                              <Pill className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{med.medicine_name}</p>
                                {med.dosage && (
                                  <p className="text-xs text-gray-600">{med.dosage}</p>
                                )}
                                {med.instructions && (
                                  <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Antecedentes Médicos */}
        {sharedConfig.includes_personal_history && (
          <>
            {/* Historial Personal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <CardTitle>Antecedentes Personales</CardTitle>
                  </div>
                  <Badge variant="secondary">{personalHistory.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {personalHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">Sin antecedentes personales registrados</p>
                ) : (
                  <div className="space-y-2">
                    {personalHistory.map((history) => (
                      <div key={history.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded">
                        <Activity className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{history.condition_name}</p>
                          {history.diagnosis_date && (
                            <p className="text-xs text-gray-600">
                              Diagnosticado: {format(new Date(history.diagnosis_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                          )}
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historial Familiar */}
            {familyHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-600" />
                      <CardTitle>Antecedentes Familiares</CardTitle>
                    </div>
                    <Badge variant="secondary">{familyHistory.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {familyHistory.map((history) => (
                      <div key={history.id} className="flex items-start gap-3 p-3 bg-pink-50 rounded">
                        <Heart className="h-4 w-4 text-pink-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{history.condition_name}</p>
                            <Badge variant="outline" className="text-xs">{history.family_member}</Badge>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Vacunas */}
        {sharedConfig.includes_vaccinations && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-green-600" />
                  <CardTitle>Vacunas</CardTitle>
                </div>
                <Badge variant="secondary">{vaccinations.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin vacunas registradas</p>
              ) : (
                <div className="space-y-2">
                  {vaccinations.map((vaccination) => (
                    <div key={vaccination.id} className="flex items-start justify-between p-3 bg-green-50 rounded">
                      <div className="flex items-start gap-3">
                        <Syringe className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{vaccination.vaccine_name}</p>
                          {vaccination.disease_protected && (
                            <p className="text-xs text-gray-600">Protege contra: {vaccination.disease_protected}</p>
                          )}
                          {vaccination.dose_details && (
                            <p className="text-xs text-gray-500">{vaccination.dose_details}</p>
                          )}
                        </div>
                      </div>
                      {vaccination.administration_date && (
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(vaccination.administration_date), 'dd MMM yyyy', { locale: es })}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer con información de seguridad */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Información Segura</p>
                <p>Esta información ha sido compartida de forma segura y encriptada. Solo las secciones autorizadas son visibles.</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
