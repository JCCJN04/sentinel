"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileIcon, FileText, ImageIcon, File } from "lucide-react"
import { documentRelationsService, type RelatedDocument } from "@/lib/document-relations-service"
import Link from "next/link"

interface DocumentRelatedProps {
  documentId: string
}

export function DocumentRelated({ documentId }: DocumentRelatedProps) {
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelatedDocuments = async () => {
      try {
        setLoading(true)
        setError(null)
        const docs = await documentRelationsService.getRelatedDocuments(documentId)
        setRelatedDocuments(docs)
      } catch (error) {
        console.error("Error fetching related documents:", error)
        setError("No se pudieron cargar los documentos relacionados")
      } finally {
        setLoading(false)
      }
    }

    if (documentId) {
      fetchRelatedDocuments()
    }
  }, [documentId])

  // Función para obtener el icono según el tipo de archivo
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (["pdf"].includes(type)) return <FileText className="h-8 w-8 text-red-500" />
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(type)) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (["doc", "docx"].includes(type)) return <FileIcon className="h-8 w-8 text-blue-700" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Buscando documentos relacionados...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-4 text-muted-foreground">{error}</div>
  }

  if (relatedDocuments.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No se encontraron documentos relacionados</div>
  }

  return (
    <div className="space-y-4">
      {relatedDocuments.map((doc) => (
        <Link href={`/dashboard/documentos/${doc.id}`} key={doc.id}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0">{getFileIcon(doc.file_type)}</div>
              <div className="flex-grow min-w-0">
                <h4 className="font-medium truncate">{doc.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">{doc.category}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {doc.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {Math.round(doc.similarity_score * 100)}% similar
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
