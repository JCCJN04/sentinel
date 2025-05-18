import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tag } from "lucide-react"

interface DocumentMetadataProps {
  document: {
    id: string
    name: string
    category: string
    tags: string[]
    date: string
    expiry_date?: string
    provider?: string
    amount?: string
    currency?: string
    status: string
    notes?: string
    file_type: string
    created_at: string
    updated_at: string
  }
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  // Formatear fechas para mejor visualización
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  const createdDate = formatDate(document.created_at)
  const updatedDate = formatDate(document.updated_at)
  const documentDate = formatDate(document.date)
  const expiryDate = document.expiry_date ? formatDate(document.expiry_date) : ""

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <span className="text-sm font-medium">{document.file_type.toUpperCase()}</span>
        </div>
        <Separator />

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Categoría</span>
          <span className="text-sm font-medium">{document.category}</span>
        </div>
        <Separator />

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Fecha</span>
          <span className="text-sm font-medium">{documentDate}</span>
        </div>
        <Separator />

        {document.expiry_date && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimiento</span>
              <span className="text-sm font-medium">{expiryDate}</span>
            </div>
            <Separator />
          </>
        )}

        {document.provider && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Proveedor/Entidad</span>
              <span className="text-sm font-medium">{document.provider}</span>
            </div>
            <Separator />
          </>
        )}

        {document.amount && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monto</span>
              <span className="text-sm font-medium">
                {document.amount} {document.currency}
              </span>
            </div>
            <Separator />
          </>
        )}

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Estado</span>
          <Badge
            variant="outline"
            className={
              document.status === "vigente"
                ? "bg-success/10 text-success border-success"
                : document.status === "próximo a vencer"
                  ? "bg-warning/10 text-warning border-warning"
                  : "bg-destructive/10 text-destructive border-destructive"
            }
          >
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Badge>
        </div>
        <Separator />

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Creado</span>
          <span className="text-sm font-medium">{createdDate}</span>
        </div>
        <Separator />

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Actualizado</span>
          <span className="text-sm font-medium">{updatedDate}</span>
        </div>
        <Separator />
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Etiquetas</span>
        <div className="flex flex-wrap gap-2">
          {document.tags && document.tags.length > 0 ? (
            document.tags.map((tag, index) => (
              <div key={index} className="flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No hay etiquetas</span>
          )}
        </div>
      </div>

      {document.notes && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Notas</span>
          <p className="text-sm">{document.notes}</p>
        </div>
      )}
    </div>
  )
}
