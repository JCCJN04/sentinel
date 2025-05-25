import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tag } from "lucide-react"

// Interface for the props of the DocumentMetadata component
interface DocumentMetadataProps {
  document: {
    id: string
    name: string
    category: string
    tags: string[]
    date: string
    expiry_date?: string | null // Changed to allow null
    provider?: string | null    // Changed to allow null
    amount?: string | null      // Changed to allow null
    currency?: string | null    // Changed to allow null
    status: string
    notes?: string | null       // Changed to allow null
    file_type: string
    created_at: string
    updated_at: string
  }
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  // Formats a date string into a more readable "dd/mm/yyyy" format.
  // Returns an empty string if the dateString is null, undefined, or invalid.
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if it's not a valid date
      }
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      // In case of any error during date parsing, return the original string
      return dateString
    }
  }

  // Format various dates from the document object
  const createdDate = formatDate(document.created_at)
  const updatedDate = formatDate(document.updated_at)
  const documentDate = formatDate(document.date)
  const expiryDate = document.expiry_date ? formatDate(document.expiry_date) : ""

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* Display File Type */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <span className="text-sm font-medium">{document.file_type.toUpperCase()}</span>
        </div>
        <Separator />

        {/* Display Category */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Categoría</span>
          <span className="text-sm font-medium">{document.category}</span>
        </div>
        <Separator />

        {/* Display Document Date */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Fecha</span>
          <span className="text-sm font-medium">{documentDate}</span>
        </div>
        <Separator />

        {/* Display Expiry Date if available */}
        {document.expiry_date && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimiento</span>
              <span className="text-sm font-medium">{expiryDate}</span>
            </div>
            <Separator />
          </>
        )}

        {/* Display Provider/Entity if available */}
        {document.provider && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Proveedor/Entidad</span>
              <span className="text-sm font-medium">{document.provider}</span>
            </div>
            <Separator />
          </>
        )}

        {/* Display Amount and Currency if amount is available */}
        {document.amount && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monto</span>
              <span className="text-sm font-medium">
                {document.amount} {document.currency || ""}
              </span>
            </div>
            <Separator />
          </>
        )}

        {/* Display Document Status with appropriate badge styling */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Estado</span>
          <Badge
            variant="outline"
            className={
              document.status === "vigente"
                ? "bg-green-100 text-green-700 border-green-700 dark:bg-green-900/50 dark:text-green-400 dark:border-green-600" // Using more specific Tailwind colors for success
                : document.status === "próximo a vencer"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400 dark:border-yellow-600" // Using more specific Tailwind colors for warning
                  : "bg-red-100 text-red-700 border-red-700 dark:bg-red-900/50 dark:text-red-400 dark:border-red-600" // Using more specific Tailwind colors for destructive
            }
          >
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Badge>
        </div>
        <Separator />

        {/* Display Creation Date */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Creado</span>
          <span className="text-sm font-medium">{createdDate}</span>
        </div>
        <Separator />

        {/* Display Last Updated Date */}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Actualizado</span>
          <span className="text-sm font-medium">{updatedDate}</span>
        </div>
        <Separator />
      </div>

      {/* Display Tags if available */}
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

      {/* Display Notes if available */}
      {document.notes && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Notas</span>
          <p className="text-sm whitespace-pre-wrap">{document.notes}</p> {/* Added whitespace-pre-wrap for better note display */}
        </div>
      )}
    </div>
  )
}
