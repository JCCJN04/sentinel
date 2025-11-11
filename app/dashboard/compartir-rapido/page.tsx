"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Share2, Copy, Check, AlertTriangle, Eye, EyeOff, ExternalLink, Clock, Shield, QrCode } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CompartirRapidoPage() {
  const [userId, setUserId] = useState<string>("")
  const [shareLink, setShareLink] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Opciones de qué compartir
  const [shareOptions, setShareOptions] = useState({
    alergias: true,
    antecedentes: true,
    tipoSangre: true,
    medicamentos: true,
    contactoEmergencia: true,
    vacunas: false,
    condicionesCronicas: true,
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const generateShareLink = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Generar enlace directo al perfil público del usuario
      const link = `${window.location.origin}/s/perfil/${userId}`
      setShareLink(link)
      
      // Opcional: Guardar en base de datos para tracking
      try {
        await supabase
          .from('share_links')
          .upsert({
            user_id: userId,
            link_type: 'perfil_medico',
            share_options: shareOptions,
            created_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id,link_type'
          })
      } catch (dbError) {
        console.log('No se pudo guardar en BD, pero el enlace funciona:', dbError)
      }
    } catch (error) {
      console.error('Error:', error)
      // Fallback: usar userId
      const link = `${window.location.origin}/s/perfil/${userId}`
      setShareLink(link)
    } finally {
      setLoading(false)
    }
  }

  const generateUniqueId = () => {
    return `${userId.substring(0, 8)}-${Date.now().toString(36)}`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleOption = (option: keyof typeof shareOptions) => {
    setShareOptions(prev => ({ ...prev, [option]: !prev[option] }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compartir Rápido</h1>
            <p className="text-gray-600 dark:text-gray-400">Genera un enlace para compartir tu información médica importante</p>
          </div>
        </div>
      </div>

      {/* Alert de Seguridad */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
        <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Información importante</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Este enlace mostrará solo información médica crítica. Compártelo únicamente con personal médico o personas de confianza.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de Configuración */}
        <Card className="border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              ¿Qué deseas compartir?
            </CardTitle>
            <CardDescription>
              Selecciona la información que aparecerá en el enlace compartido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="alergias" className="font-medium">Alergias</Label>
                  <p className="text-xs text-muted-foreground">Alergias médicas y alimentarias</p>
                </div>
                <Switch
                  id="alergias"
                  checked={shareOptions.alergias}
                  onCheckedChange={() => toggleOption('alergias')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tipoSangre" className="font-medium">Tipo de Sangre</Label>
                  <p className="text-xs text-muted-foreground">Grupo sanguíneo y factor RH</p>
                </div>
                <Switch
                  id="tipoSangre"
                  checked={shareOptions.tipoSangre}
                  onCheckedChange={() => toggleOption('tipoSangre')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="medicamentos" className="font-medium">Medicamentos Actuales</Label>
                  <p className="text-xs text-muted-foreground">Medicación en curso</p>
                </div>
                <Switch
                  id="medicamentos"
                  checked={shareOptions.medicamentos}
                  onCheckedChange={() => toggleOption('medicamentos')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="antecedentes" className="font-medium">Antecedentes Médicos</Label>
                  <p className="text-xs text-muted-foreground">Historial de enfermedades</p>
                </div>
                <Switch
                  id="antecedentes"
                  checked={shareOptions.antecedentes}
                  onCheckedChange={() => toggleOption('antecedentes')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="condicionesCronicas" className="font-medium">Condiciones Crónicas</Label>
                  <p className="text-xs text-muted-foreground">Enfermedades de largo plazo</p>
                </div>
                <Switch
                  id="condicionesCronicas"
                  checked={shareOptions.condicionesCronicas}
                  onCheckedChange={() => toggleOption('condicionesCronicas')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="contactoEmergencia" className="font-medium">Contacto de Emergencia</Label>
                  <p className="text-xs text-muted-foreground">Teléfono de contacto</p>
                </div>
                <Switch
                  id="contactoEmergencia"
                  checked={shareOptions.contactoEmergencia}
                  onCheckedChange={() => toggleOption('contactoEmergencia')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="vacunas" className="font-medium">Vacunas</Label>
                  <p className="text-xs text-muted-foreground">Historial de vacunación</p>
                </div>
                <Switch
                  id="vacunas"
                  checked={shareOptions.vacunas}
                  onCheckedChange={() => toggleOption('vacunas')}
                />
              </div>
            </div>

            <Button 
              onClick={generateShareLink}
              disabled={loading || !userId}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
            >
              {loading ? "Generando..." : "Generar Enlace"}
            </Button>
          </CardContent>
        </Card>

        {/* Panel de Enlace Generado */}
        <div className="space-y-6">
          <Card className="border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-cyan-600" />
                Tu Enlace Compartido
              </CardTitle>
              <CardDescription>
                Comparte este enlace con quien necesite ver tu información médica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareLink ? (
                <>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm break-all font-mono">{shareLink}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Enlace
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => window.open(shareLink, '_blank')}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vista Previa
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Información del Enlace
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• El enlace es permanente hasta que lo desactives</p>
                      <p>• Puedes generar nuevos enlaces en cualquier momento</p>
                      <p>• Solo se muestra información seleccionada</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Configura las opciones y genera tu enlace</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Shield className="h-5 w-5" />
                Seguridad y Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-emerald-900 dark:text-emerald-100">
              <p>✓ Sin documentos completos ni datos sensibles</p>
              <p>✓ Solo información médica crítica</p>
              <p>✓ Ideal para emergencias médicas</p>
              <p>✓ Puedes desactivar el enlace cuando quieras</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
