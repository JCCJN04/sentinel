"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, Pill, ShieldAlert, Syringe, ClipboardList, 
  BarChart3, ScrollText, Trash2, CheckCircle2, AlertCircle
} from "lucide-react"
import { revokeResourceAction } from "@/app/dashboard/compartir/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SharedResource {
  id: string
  resource_type: string
  shared_at: string
  expires_at: string | null
  notes: string | null
}

interface SharedResourcesListProps {
  doctorName: string
  shares: SharedResource[]
}

const RESOURCE_ICONS = {
  all_documents: { 
    icon: FileText, 
    label: 'Documentos Médicos', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30'
  },
  all_prescriptions: { 
    icon: ScrollText, 
    label: 'Recetas Médicas', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30'
  },
  all_medications: { 
    icon: Pill, 
    label: 'Medicamentos Activos', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30'
  },
  all_allergies: { 
    icon: ShieldAlert, 
    label: 'Alergias y Reacciones', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30'
  },
  all_vaccines: { 
    icon: Syringe, 
    label: 'Cartilla de Vacunación', 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30'
  },
  all_antecedentes: { 
    icon: ClipboardList, 
    label: 'Antecedentes Médicos', 
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30'
  },
  all_reports: { 
    icon: BarChart3, 
    label: 'Reportes y Análisis', 
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30'
  },
}

export function SharedResourcesList({ doctorName, shares }: SharedResourcesListProps) {
  const router = useRouter()
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set())
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<{id: string, label: string} | null>(null)

  const handleRevoke = async () => {
    if (!selectedShare) return

    setRevokingIds(prev => new Set(prev).add(selectedShare.id))
    setRevokeDialogOpen(false)

    try {
      const result = await revokeResourceAction(selectedShare.id)
      
      if (result.success) {
        toast.success(`✓ Acceso revocado: ${selectedShare.label}`)
        router.refresh()
      } else {
        toast.error(result.error || "Error al revocar acceso")
      }
    } catch (error) {
      console.error('Error revoking resource:', error)
      toast.error("Error al revocar acceso")
    } finally {
      setRevokingIds(prev => {
        const next = new Set(prev)
        next.delete(selectedShare.id)
        return next
      })
      setSelectedShare(null)
    }
  }

  if (shares.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No hay recursos compartidos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona información para compartir con {doctorName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-2 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Acceso Activo</CardTitle>
              <CardDescription>
                {shares.length} {shares.length === 1 ? 'recurso compartido' : 'recursos compartidos'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {shares.map(share => {
              const resourceInfo = RESOURCE_ICONS[share.resource_type as keyof typeof RESOURCE_ICONS]
              if (!resourceInfo) return null

              const Icon = resourceInfo.icon
              const isRevoking = revokingIds.has(share.id)
              const sharedDate = new Date(share.shared_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })

              return (
                <div 
                  key={share.id}
                  className={`
                    group relative flex items-center gap-4 p-4 rounded-xl border-2 
                    transition-all duration-200
                    ${resourceInfo.bgColor} border-transparent
                    ${isRevoking ? 'opacity-50' : 'hover:shadow-md'}
                  `}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center">
                    <Icon className={`h-6 w-6 ${resourceInfo.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">
                        {resourceInfo.label}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Activo
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Desde {sharedDate}</span>
                      {share.expires_at && (
                        <span className="text-orange-600 dark:text-orange-400">
                          • Expira {new Date(share.expires_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      )}
                    </div>

                    {share.notes && (
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        "{share.notes}"
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedShare({ id: share.id, label: resourceInfo.label })
                      setRevokeDialogOpen(true)
                    }}
                    disabled={isRevoking}
                    className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar acceso a {selectedShare?.label}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {doctorName} ya no podrá ver esta información en tu expediente médico.
              </p>
              <p className="text-sm">
                Puedes volver a compartirla cuando lo necesites.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Revocar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
