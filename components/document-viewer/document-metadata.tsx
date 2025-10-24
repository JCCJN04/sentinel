"use client"

import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Edit, Loader2, XCircle, AlertCircle, Info, Zap } from "lucide-react"
import type { Document } from "@/lib/document-service"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the props for the component, including the new ones for editing
export interface DocumentMetadataProps {
  document: Document
  isEditing: boolean
  isSaving: boolean
  editForm: Partial<Document>
  onFormChange: Dispatch<SetStateAction<Partial<Document>>>
  onEditToggle: () => void
  onSaveChanges: () => void
}

// Helper component for read-only fields
const InfoField = ({ 
  label, 
  value,
  icon: Icon
}: { 
  label: string
  value: string | null | undefined
  icon?: React.ComponentType<{ className: string }>
}) =>
  value ? (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  ) : null

export function DocumentMetadata({
  document,
  isEditing,
  isSaving,
  editForm,
  onFormChange,
  onEditToggle,
  onSaveChanges,
}: DocumentMetadataProps) {
  // Handle form field changes
  const handleChange = (field: keyof Document, value: string | string[]) => {
    onFormChange((prev) => ({ ...prev, [field]: value }))
  }

  const hasChanges = JSON.stringify(editForm) !== JSON.stringify(document)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Información del documento
        </h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditToggle} 
              disabled={isSaving}
              className="text-xs h-8"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={onSaveChanges} 
              disabled={isSaving || !hasChanges}
              className="text-xs h-8"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEditToggle}
            className="text-xs h-8"
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        )}
      </div>

      <Separator className="my-3" />

      {isEditing ? (
        // EDITING VIEW
        <div className="space-y-4 text-sm">
          {hasChanges && !isSaving && (
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 py-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
                Tienes cambios sin guardar
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc-name" className="text-xs font-semibold uppercase tracking-wide">Nombre</Label>
            <Input
              id="doc-name"
              value={editForm.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-9 text-sm"
              placeholder="Nombre del documento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-category" className="text-xs font-semibold uppercase tracking-wide">Categoría</Label>
            <Input
              id="doc-category"
              value={editForm.category || ""}
              onChange={(e) => handleChange("category", e.target.value)}
              className="h-9 text-sm"
              placeholder="Categoría"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doc-date" className="text-xs font-semibold uppercase tracking-wide">Fecha</Label>
              <Input
                id="doc-date"
                type="date"
                value={editForm.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-expiry" className="text-xs font-semibold uppercase tracking-wide">Vencimiento</Label>
              <Input
                id="doc-expiry"
                type="date"
                value={editForm.expiry_date || ""}
                onChange={(e) => handleChange("expiry_date", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-provider" className="text-xs font-semibold uppercase tracking-wide">Proveedor</Label>
            <Input
              id="doc-provider"
              value={editForm.provider || ""}
              onChange={(e) => handleChange("provider", e.target.value)}
              className="h-9 text-sm"
              placeholder="Proveedor o institución"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-amount" className="text-xs font-semibold uppercase tracking-wide">Monto</Label>
            <Input
              id="doc-amount"
              type="number"
              value={editForm.amount || ""}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="h-9 text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-tags" className="text-xs font-semibold uppercase tracking-wide">Etiquetas</Label>
            <Input
              id="doc-tags"
              placeholder="etiqueta1, etiqueta2, etiqueta3"
              value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : ""}
              onChange={(e) => handleChange("tags", e.target.value.split(",").map(tag => tag.trim()))}
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground">Separar con comas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-notes" className="text-xs font-semibold uppercase tracking-wide">Notas</Label>
            <Textarea
              id="doc-notes"
              value={editForm.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Añade notas o detalles importantes..."
              className="min-h-20 text-sm resize-none"
            />
          </div>
        </div>
      ) : (
        // READ-ONLY VIEW
        <div className="space-y-1">
          {document.date && (
            <InfoField 
              label="Fecha del documento" 
              value={new Date(document.date).toLocaleDateString('es-ES', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            />
          )}

          {document.category && (
            <InfoField 
              label="Categoría" 
              value={document.category}
            />
          )}

          {document.provider && (
            <InfoField 
              label="Proveedor" 
              value={document.provider}
            />
          )}

          {document.expiry_date && (
            <InfoField 
              label="Fecha de vencimiento" 
              value={new Date(document.expiry_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            />
          )}

          {document.amount && (
            <InfoField 
              label="Monto" 
              value={`${document.amount} ${document.currency || 'USD'}`}
            />
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {document.notes && (
            <div className="py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notas</p>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {document.notes}
              </p>
            </div>
          )}

          {!document.date && !document.category && !document.provider && !document.expiry_date && !document.amount && !document.tags && !document.notes && (
            <Alert className="bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 py-2">
              <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <AlertDescription className="text-slate-700 dark:text-slate-300 text-xs">
                No hay información adicional. Haz clic en "Editar" para agregar detalles.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}