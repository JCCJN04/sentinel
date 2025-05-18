"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, MessageSquare, Edit, Trash2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

interface Annotation {
  id: string
  text: string
  date: string
  user_id: string
}

interface DocumentAnnotationsProps {
  documentId: string
}

export function DocumentAnnotations({ documentId }: DocumentAnnotationsProps) {
  const { user } = useAuth()
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [newAnnotation, setNewAnnotation] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnotations()
  }, [documentId])

  const fetchAnnotations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("document_annotations")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transformar los datos
      const formattedAnnotations = data.map((item) => ({
        id: item.id,
        text: item.text,
        date: new Date(item.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        user_id: item.user_id,
      }))

      setAnnotations(formattedAnnotations)
    } catch (err: any) {
      console.error("Error fetching annotations:", err)
      setError(err.message || "Error al cargar las notas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAnnotation = async () => {
    if (!newAnnotation.trim() || !user) return

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("document_annotations")
        .insert({
          document_id: documentId,
          text: newAnnotation,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Añadir la nueva anotación a la lista
      const newItem = {
        id: data.id,
        text: data.text,
        date: new Date(data.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        user_id: data.user_id,
      }

      setAnnotations([newItem, ...annotations])
      setNewAnnotation("")
    } catch (err: any) {
      console.error("Error adding annotation:", err)
      setError(err.message || "Error al añadir la nota")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditStart = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from("document_annotations").update({ text: editText }).eq("id", id)

      if (error) throw error

      // Actualizar la anotación en la lista
      setAnnotations(annotations.map((anno) => (anno.id === id ? { ...anno, text: editText } : anno)))
      setEditingId(null)
    } catch (err: any) {
      console.error("Error updating annotation:", err)
      setError(err.message || "Error al actualizar la nota")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta nota?")) return

    try {
      const { error } = await supabase.from("document_annotations").delete().eq("id", id)

      if (error) throw error

      // Eliminar la anotación de la lista
      setAnnotations(annotations.filter((anno) => anno.id !== id))
    } catch (err: any) {
      console.error("Error deleting annotation:", err)
      setError(err.message || "Error al eliminar la nota")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Cargando notas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notas y comentarios</h3>

      <div className="space-y-2">
        <Textarea
          placeholder="Añadir una nota o comentario..."
          value={newAnnotation}
          onChange={(e) => setNewAnnotation(e.target.value)}
          rows={3}
        />
        <Button onClick={handleAddAnnotation} disabled={!newAnnotation.trim() || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Añadir nota
            </>
          )}
        </Button>
      </div>

      {error && <div className="text-sm text-destructive py-2">{error}</div>}

      <Separator />

      <div className="space-y-4">
        {annotations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay notas o comentarios para este documento.
          </p>
        ) : (
          annotations.map((anno) => (
            <div key={anno.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1 bg-muted">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{anno.date}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditStart(anno.id, anno.text)}
                        disabled={editingId === anno.id}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDelete(anno.id)}
                        disabled={editingId === anno.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {editingId === anno.id ? (
                    <div className="space-y-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(anno.id)}
                          disabled={!editText.trim() || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            "Guardar"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{anno.text}</p>
                  )}
                </div>
              </div>
              <Separator />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
