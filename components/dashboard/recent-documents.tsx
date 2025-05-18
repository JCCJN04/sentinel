"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, FileImage, FileIcon as FilePdf, FileSpreadsheet } from "lucide-react"
import { documentService, type Document } from "@/lib/document-service"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export function RecentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecentDocuments() {
      try {
        setLoading(true)
        const docs = await documentService.getRecentDocuments(5)
        setDocuments(docs)
        setError(null)
      } catch (err) {
        console.error("Error al cargar documentos recientes:", err)
        setError("No se pudieron cargar los documentos recientes")
      } finally {
        setLoading(false)
      }
    }

    loadRecentDocuments()
  }, [])

  const getFileIcon = (type: string) => {
    const fileType = type.toLowerCase()
    if (fileType === "pdf") {
      return <FilePdf className="h-4 w-4 text-red-500" />
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
      return <FileImage className="h-4 w-4 text-blue-500" />
    } else if (["xls", "xlsx", "csv"].includes(fileType)) {
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  // Función para formatear la fecha relativa
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "Hace unos segundos"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `Hace ${days} ${days === 1 ? "día" : "días"}`
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `Hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`
    } else {
      const months = Math.floor(diffInSeconds / 2592000)
      return `Hace ${months} ${months === 1 ? "mes" : "meses"}`
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center justify-between space-x-4 rounded-md border p-3">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        {error}. Por favor, recarga la página para intentar nuevamente.
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No hay documentos recientes. ¡Comienza subiendo tu primer documento!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Link
          href={`/dashboard/documentos/${doc.id}`}
          key={doc.id}
          className="flex items-center justify-between space-x-4 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10">{getFileIcon(doc.file_type)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{doc.name}</p>
              <p className="text-sm text-muted-foreground">{doc.category}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{getRelativeTime(doc.created_at)}</div>
        </Link>
      ))}
    </div>
  )
}
