import { supabaseBrowserClient as supabase } from "./supabase"

export interface RelatedDocument {
  id: string
  name: string
  category: string
  tags: string[]
  file_type: string
  file_url?: string // This means string | undefined
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
        // Assuming fallbackData is an array of objects from Supabase.
        // docFromDb will be 'any' if fallbackData is not strongly typed.
        const relatedDocs = (fallbackData || []).map((docFromDb: any): RelatedDocument => {
          // Calcular puntuación de similitud basada en etiquetas coincidentes
          // Ensure 'tag' parameter has an explicit type (string)
          const commonTags = (docFromDb.tags || []).filter((tag: string) => tags.includes(tag))
          const similarityScore = commonTags.length / Math.max(tags.length, (docFromDb.tags || []).length || 1)

          // Generar URL del archivo
          let publicFileUrl: string | null = null
          // Ensure docFromDb.file_path is a string before using it
          if (docFromDb.file_path && typeof docFromDb.file_path === 'string') {
            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(docFromDb.file_path)
            publicFileUrl = urlData?.publicUrl || null // Safely access publicUrl, default to null
          }

          // Construct an object that strictly matches the RelatedDocument interface
          const relatedDocItem: RelatedDocument = {
            id: String(docFromDb.id), // Coerce to string to satisfy RelatedDocument.id
            name: String(docFromDb.name), // Coerce to string
            category: String(docFromDb.category), // Coerce to string
            // Ensure tags is string[]
            tags: Array.isArray(docFromDb.tags) ? docFromDb.tags.map(String).filter((tag:string) => typeof tag === 'string') : [],
            file_type: String(docFromDb.file_type), // Coerce to string
            // CRITICAL FIX: Convert null to undefined for file_url
            file_url: publicFileUrl === null ? undefined : publicFileUrl,
            similarity_score: Number(similarityScore), // Coerce to number
          };
          return relatedDocItem;
        })

        // Ordenar por puntuación de similitud
        return relatedDocs.sort((a, b) => b.similarity_score - a.similarity_score)
      }

      // Procesar los resultados de la función RPC
      // Ensure the objects returned by the RPC also conform to RelatedDocument
      return (data || []).map((docFromRpc: any): RelatedDocument => {
        let rpcFileUrl: string | null = docFromRpc.file_url; // Assume file_url might be null
        return {
            id: String(docFromRpc.id),
            name: String(docFromRpc.name),
            category: String(docFromRpc.category),
            tags: Array.isArray(docFromRpc.tags) ? docFromRpc.tags.map(String).filter((tag:string) => typeof tag === 'string') : [],
            file_type: String(docFromRpc.file_type),
            file_url: rpcFileUrl === null ? undefined : rpcFileUrl, // Convert null to undefined
            similarity_score: Number(docFromRpc.similarity_score),
        };
      })
    } catch (err) { // Changed error variable name to avoid conflict if 'error' is used above
      console.error("Error in getRelatedDocuments:", err)
      return []
    }
  },
}
