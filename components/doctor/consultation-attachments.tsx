"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import type { ConsultationImage } from "@/lib/data/doctor.repo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export type ConsultationAttachmentsProps = {
  initialAttachments: ConsultationImage[]
}

type DraftAttachment = {
  title: string
  description: string
  file?: File
  preview?: string
}

export function ConsultationAttachments({ initialAttachments }: ConsultationAttachmentsProps) {
  const [attachments, setAttachments] = useState<ConsultationImage[]>(initialAttachments)
  const [draft, setDraft] = useState<DraftAttachment>({ title: "", description: "" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    setDraft((prev) => ({ ...prev, file, preview }))
  }

  const handleDraftChange = (
    field: keyof DraftAttachment,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const resetDraft = () => {
    if (draft.preview) URL.revokeObjectURL(draft.preview)
    setDraft({ title: "", description: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.file || !draft.preview) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona una imagen para adjuntar a la consulta.",
        variant: "destructive",
      })
      return
    }

    const newAttachment: ConsultationImage = {
      id: `local-${Date.now()}`,
      consultationId: "local",
      title: draft.title || draft.file.name,
      description: draft.description || undefined,
      url: draft.preview,
      uploadedAt: new Date().toISOString(),
    }

    setAttachments((prev) => [newAttachment, ...prev])
    toast({
      title: "Imagen agregada",
      description: "La imagen se añadió de forma local para esta sesión.",
    })

    setIsDialogOpen(false)
    resetDraft()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Imágenes de la consulta</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetDraft()
          setIsDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button variant="outline">Agregar imagen</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva imagen</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="attachment-title">Título</Label>
                <Input
                  id="attachment-title"
                  placeholder="Ej. Radiografía lateral"
                  value={draft.title}
                  onChange={handleDraftChange("title")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attachment-description">Descripción</Label>
                <Textarea
                  id="attachment-description"
                  placeholder="Detalles sobre la imagen"
                  value={draft.description}
                  onChange={handleDraftChange("description")}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attachment-file">Archivo</Label>
                <Input
                  ref={fileInputRef}
                  id="attachment-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {draft.preview && (
                  <div className="relative mt-2 h-40 overflow-hidden rounded-md border">
                    <Image
                      src={draft.preview}
                      alt={draft.title || "Vista previa"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay imágenes asociadas a esta consulta.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="overflow-hidden">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{attachment.title}</CardTitle>
                {attachment.description && (
                  <p className="text-sm text-muted-foreground">{attachment.description}</p>
                )}
              </CardHeader>
              <CardContent className="relative h-40">
                <Image
                  src={attachment.url}
                  alt={attachment.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {new Date(attachment.uploadedAt).toLocaleString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
