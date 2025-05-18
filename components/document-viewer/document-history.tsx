"use client"

import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { FileEdit, FileText, Loader2, Share2, Trash2, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Tipo para el historial
interface HistoryItem {
  id: string
  action: string
  date: string
  time: string
  user: string
  details?: string
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return <Upload className="h-4 w-4 text-primary" />
    case "viewed":
      return <FileText className="h-4 w-4 text-muted-foreground" />
    case "edited":
      return <FileEdit className="h-4 w-4 text-warning" />
    case "shared":
      return <Share2 className="h-4 w-4 text-info" />
    case "deleted":
      return <Trash2 className="h-4 w-4 text-destructive" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getActionText = (action: string) => {
  switch (action) {
    case "created":
      return "Creado"
    case "viewed":
      return "Visualizado"
    case "edited":
      return "Editado"
    case "shared":
      return "Compartido"
    case "deleted":
      return "Eliminado"
    default:
      return action
  }
}

interface DocumentHistoryProps {
  documentId: string
}

export function DocumentHistory({ documentId }: DocumentHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("document_history")
          .select("*")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Transformar los datos para el formato que necesitamos
        const formattedHistory = data.map((item) => {
          const date = new Date(item.created_at)
          return {
            id: item.id,
            action: item.action,
            date: date.toLocaleDateString("es-ES"),
            time: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            user: "Usuario", // En una implementación real, obtendríamos el nombre del usuario
            details: item.details,
          }
        })

        setHistory(formattedHistory)
      } catch (err: any) {
        console.error("Error fetching document history:", err)
        setError(err.message || "Error al cargar el historial")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [documentId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Cargando historial...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay historial disponible para este documento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Historial de actividad</h3>

      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full p-1 bg-muted">{getActionIcon(item.action)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getActionText(item.action)}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.date} a las {item.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Por {item.user}</p>
                {item.details && <p className="text-sm">{item.details}</p>}
              </div>
            </div>
            {index < history.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}
