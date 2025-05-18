import { supabase } from "./supabase"

export interface RelatedDocument {
  id: string
  name: string
  category: string
  tags: string[]
  file_type: string
  file_url?: string
  similarity_score: number
}

export const documentRelationsService = {
  async getRelatedDocuments(documentId: string, limit = 5): Promise<RelatedDocument[]> {
    try {
      // Primero obtenemos el documento actual para conocer sus etiquetas
      const { data: currentDoc, error: docError } = await supabase
        .from("documents")
        .select("tags, user_id")
        .eq("id", documentId)
        .single()

      if (docError || !currentDoc) {
        console.error("Error fetching document:", docError)
        return []
      }

      const tags = currentDoc.tags || []
      const userId = currentDoc.user_id

      if (tags.length === 0) {
        return [] // No hay etiquetas para relacionar
      }

      // Consulta SQL directa para encontrar documentos con etiquetas similares
      // y calcular una puntuación de similitud basada en etiquetas coincidentes
      const { data, error } = await supabase.rpc("find_related_documents", {
        p_document_id: documentId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error finding related documents:", error)

        // Fallback: Buscar documentos con al menos una etiqueta en común
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("documents")
          .select("id, name, category, tags, file_type, file_path")
          .eq("user_id", userId)
          .neq("id", documentId) // Excluir el documento actual
          .filter("tags", "cs", `{${tags.join(",")}}`) // Buscar coincidencia en el array de etiquetas
          .limit(limit)

        if (fallbackError) {
          console.error("Error in fallback related documents:", fallbackError)
          return []
        }

        // Procesar los resultados del fallback
        const relatedDocs = fallbackData.map((doc) => {
          // Calcular puntuación de similitud basada en etiquetas coincidentes
          const commonTags = (doc.tags || []).filter((tag) => tags.includes(tag))
          const similarityScore = commonTags.length / Math.max(tags.length, doc.tags?.length || 1)

          // Generar URL del archivo
          let fileUrl = null
          if (doc.file_path) {
            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(doc.file_path)
            fileUrl = urlData.publicUrl
          }

          return {
            id: doc.id,
            name: doc.name,
            category: doc.category,
            tags: doc.tags || [],
            file_type: doc.file_type,
            file_url: fileUrl,
            similarity_score: similarityScore,
          }
        })

        // Ordenar por puntuación de similitud
        return relatedDocs.sort((a, b) => b.similarity_score - a.similarity_score)
      }

      // Procesar los resultados de la función RPC
      return data.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        category: doc.category,
        tags: doc.tags || [],
        file_type: doc.file_type,
        file_url: doc.file_url,
        similarity_score: doc.similarity_score,
      }))
    } catch (error) {
      console.error("Error in getRelatedDocuments:", error)
      return []
    }
  },
}
