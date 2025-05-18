"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { FileText, FileImage, FileIcon as FilePdf, FileSpreadsheet } from "lucide-react"
import { reportsService } from "@/lib/reports-service"

interface DocumentsTableProps {
  year?: string
}

export function DocumentsTable({ year }: DocumentsTableProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await reportsService.getRecentDocumentsForTable(10, year)
        setDocuments(data)
      } catch (error) {
        console.error("Error al cargar documentos recientes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "pdf":
        return <FilePdf className="h-4 w-4 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <FileImage className="h-4 w-4 text-blue-500" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vigente":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success">
            Vigente
          </Badge>
        )
      case "próximo a vencer":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            Próximo a vencer
          </Badge>
        )
      case "vencido":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
            Vencido
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex justify-center">
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex justify-center">
          <p className="text-muted-foreground">No hay documentos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 p-4 font-medium border-b">
        <div>Tipo</div>
        <div>Nombre</div>
        <div>Categoría</div>
        <div>Fecha</div>
        <div>Estado</div>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
        >
          <div>{getFileIcon(doc.file_type)}</div>
          <div className="font-medium">{doc.name}</div>
          <div>{doc.category}</div>
          <div>{doc.date}</div>
          <div>{getStatusBadge(doc.status)}</div>
        </div>
      ))}
    </div>
  )
}
