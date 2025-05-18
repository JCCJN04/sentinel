"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Loader2, Share2, Users } from "lucide-react"
import { familyService, type FamilyMember } from "@/lib/family-service"
import { documentService, type Document } from "@/lib/document-service"

export default function CompartirFamiliaPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [documentId])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [doc, members] = await Promise.all([
        documentService.getDocumentById(documentId),
        familyService.getFamilyMembers(),
      ])

      if (!doc) {
        throw new Error("Documento no encontrado")
      }

      setDocument(doc)
      setFamilyMembers(members)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Error al cargar los datos. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const handleShareDocument = async () => {
    if (selectedMembers.length === 0) {
      setError("Por favor, selecciona al menos un miembro de la familia.")
      return
    }

    setIsSharing(true)
    setError(null)

    try {
      await familyService.shareDocumentWithFamily(documentId, selectedMembers)

      setSuccess("Documento compartido correctamente.")

      // Redirect after a delay
      setTimeout(() => {
        router.push("/dashboard/familia")
      }, 2000)
    } catch (error) {
      console.error("Error sharing document:", error)
      setError("Error al compartir el documento. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSharing(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Compartir con familia</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-success/10 text-success border-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar miembros</CardTitle>
            <CardDescription>
              Elige los miembros de tu familia con quienes quieres compartir este documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {familyMembers.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay miembros</h3>
                <p className="text-muted-foreground mb-4">Aún no has invitado a ningún miembro de tu familia.</p>
                <Button onClick={() => router.push("/dashboard/familia")}>Ir a gestión familiar</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-4 p-4 border rounded-md">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleToggleMember(member.id)}
                    />
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(member.member_name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`member-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.member_name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{member.member_email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              onClick={handleShareDocument}
              disabled={isSharing || selectedMembers.length === 0 || familyMembers.length === 0}
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compartiendo...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir documento
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
            <CardDescription>Información del documento a compartir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {document && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{document.name}</h3>
                    <p className="text-sm text-muted-foreground">{document.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span>{document.date}</span>
                  </div>
                  {document.expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <span>{document.expiry_date}</span>
                    </div>
                  )}
                  {document.provider && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proveedor:</span>
                      <span>{document.provider}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Etiquetas</span>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
