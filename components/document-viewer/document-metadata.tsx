"use client"

import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Edit, Loader2, XCircle } from "lucide-react"
import type { Document } from "@/lib/document-service"
import { Separator } from "@/components/ui/separator"

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
const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) =>
  value ? (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-right">{value}</span>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Información</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEditToggle} disabled={isSaving}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={onSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
      </div>

      <Separator />

      {isEditing ? (
        // EDITING VIEW
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <Label htmlFor="doc-name">Nombre</Label>
            <Input
              id="doc-name"
              value={editForm.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-category">Categoría</Label>
            <Input
              id="doc-category"
              value={editForm.category || ""}
              onChange={(e) => handleChange("category", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-date">Fecha del documento</Label>
            <Input
              id="doc-date"
              type="date"
              value={editForm.date || ""}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-expiry">Fecha de vencimiento</Label>
            <Input
              id="doc-expiry"
              type="date"
              value={editForm.expiry_date || ""}
              onChange={(e) => handleChange("expiry_date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-provider">Proveedor</Label>
            <Input
              id="doc-provider"
              value={editForm.provider || ""}
              onChange={(e) => handleChange("provider", e.target.value)}
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor="doc-amount">Monto</Label>
            <Input
              id="doc-amount"
              type="number"
              value={editForm.amount || ""}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-tags">Etiquetas</Label>
            <Input
              id="doc-tags"
              placeholder="tag1, tag2, tag3"
              value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : ""}
              onChange={(e) => handleChange("tags", e.target.value.split(",").map(tag => tag.trim()))}
            />
             <p className="text-xs text-muted-foreground">Separar etiquetas con comas.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-notes">Notas Adicionales</Label>
            <Textarea
              id="doc-notes"
              value={editForm.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Añade notas o un resumen aquí..."
            />
          </div>
        </div>
      ) : (
        // READ-ONLY VIEW
        <div className="space-y-2 text-sm">
          <InfoField label="Categoría" value={document.category} />
          <InfoField label="Fecha" value={document.date} />
          <InfoField label="Vencimiento" value={document.expiry_date} />
          <InfoField label="Proveedor" value={document.provider} />
          <InfoField label="Monto" value={document.amount?.toString()} />

          {document.tags && document.tags.length > 0 && (
            <div>
               <span className="text-muted-foreground">Etiquetas:</span>
               <div className="flex flex-wrap gap-1 mt-1">
                 {document.tags.map((tag, index) => (
                   <div key={index} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                     {tag}
                   </div>
                 ))}
               </div>
            </div>
          )}
          {document.notes && (
            <div className="pt-2">
              <span className="text-muted-foreground">Notas:</span>
              <p className="whitespace-pre-wrap text-sm">{document.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}