"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, Pill, ShieldAlert, Syringe, ClipboardList, 
  BarChart3, ScrollText, Loader2, CheckCircle2, Sparkles, Lock
} from "lucide-react"
import { shareResourceAction } from "@/app/dashboard/compartir/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ShareResourcesFormProps {
  doctorId: string
  doctorName: string
  currentShares?: any[]
}

const RESOURCE_OPTIONS = [
  { 
    type: 'all_documents' as const, 
    label: 'Documentos Médicos', 
    icon: FileText,
    description: 'Estudios, análisis y documentación clínica',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  { 
    type: 'all_prescriptions' as const, 
    label: 'Recetas Médicas', 
    icon: ScrollText,
    description: 'Historial de prescripciones y tratamientos',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  { 
    type: 'all_medications' as const, 
    label: 'Medicamentos Activos', 
    icon: Pill,
    description: 'Lista de medicamentos y dosis actuales',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  { 
    type: 'all_allergies' as const, 
    label: 'Alergias y Reacciones', 
    icon: ShieldAlert,
    description: 'Registro completo de alergias conocidas',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  { 
    type: 'all_vaccines' as const, 
    label: 'Cartilla de Vacunación', 
    icon: Syringe,
    description: 'Historial completo de inmunizaciones',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  { 
    type: 'all_antecedentes' as const, 
    label: 'Antecedentes Médicos', 
    icon: ClipboardList,
    description: 'Historial familiar y personal de salud',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  { 
    type: 'all_reports' as const, 
    label: 'Reportes y Análisis', 
    icon: BarChart3,
    description: 'Informes médicos y resultados de laboratorio',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800'
  },
]

export function ShareResourcesForm({ doctorId, doctorName, currentShares = [] }: ShareResourcesFormProps) {
  const router = useRouter()
  const [selectedResources, setSelectedResources] = useState<Set<string>>(
    new Set(currentShares.map(s => s.resource_type))
  )
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = (resourceType: string) => {
    setSelectedResources(prev => {
      const next = new Set(prev)
      if (next.has(resourceType)) {
        next.delete(resourceType)
      } else {
        next.add(resourceType)
      }
      return next
    })
  }

  const handleShare = async () => {
    if (selectedResources.size === 0) {
      toast.error("Selecciona al menos un tipo de recurso")
      return
    }

    setIsLoading(true)

    try {
      const promises = Array.from(selectedResources).map(resourceType =>
        shareResourceAction(
          doctorId,
          resourceType as any,
          null,
          null,
          notes || null
        )
      )

      const results = await Promise.all(promises)
      
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        toast.error(`Error al compartir: ${failed[0].error}`)
      } else {
        toast.success(`✓ Recursos compartidos con ${doctorName}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error sharing resources:', error)
      toast.error("Error al compartir recursos")
    } finally {
      setIsLoading(false)
    }
  }

  const newSelections = Array.from(selectedResources).filter(
    type => !currentShares.some(s => s.resource_type === type)
  )

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Seleccionar Información</CardTitle>
            <CardDescription>
              Elige qué puede ver {doctorName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Selection Grid */}
        <div className="grid gap-3">
          {RESOURCE_OPTIONS.map(resource => {
            const Icon = resource.icon
            const isSelected = selectedResources.has(resource.type)
            const isCurrentlyShared = currentShares.some(s => s.resource_type === resource.type)
            const isNewSelection = isSelected && !isCurrentlyShared

            return (
              <div 
                key={resource.type}
                onClick={() => !isLoading && handleToggle(resource.type)}
                className={`
                  group relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected 
                    ? `${resource.bgColor} ${resource.borderColor} shadow-sm` 
                    : 'border-border hover:border-primary/30 hover:bg-accent/30'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
                `}
              >
                {/* Checkbox */}
                <Checkbox
                  id={resource.type}
                  checked={isSelected}
                  disabled={isLoading}
                  className="mt-1"
                />

                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                  transition-all duration-200
                  ${isSelected ? resource.bgColor : 'bg-muted'}
                `}>
                  <Icon className={`h-6 w-6 ${isSelected ? resource.color : 'text-muted-foreground'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor={resource.type}
                      className="font-semibold cursor-pointer"
                    >
                      {resource.label}
                    </Label>
                    {isCurrentlyShared && !isNewSelection && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        <Lock className="h-3 w-3" />
                        Activo
                      </span>
                    )}
                    {isNewSelection && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <CheckCircle2 className={`h-5 w-5 ${resource.color} flex-shrink-0`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-medium">
            Nota para el doctor <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Ej: Compartiendo información para evaluación de síntomas recientes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={handleShare} 
            disabled={isLoading || newSelections.length === 0}
            size="lg"
            className="flex-1 gap-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Compartiendo...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Compartir {newSelections.length > 0 && `(${newSelections.length})`}
              </>
            )}
          </Button>
        </div>

        {newSelections.length === 0 && selectedResources.size > 0 && (
          <p className="text-sm text-center text-muted-foreground">
            Todos los recursos seleccionados ya están compartidos
          </p>
        )}

        {selectedResources.size === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            Selecciona al menos un recurso para compartir
          </p>
        )}
      </CardContent>
    </Card>
  )
}
