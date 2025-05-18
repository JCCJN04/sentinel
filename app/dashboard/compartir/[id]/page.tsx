"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Link2, Mail, QrCode, Shield, FileText, Check, Loader2 } from "lucide-react"
import { shareService, type ShareOptions } from "@/lib/share-service"
import { useToast } from "@/components/ui/use-toast"
import { QRCodeCanvas } from "qrcode.react"

// Mock document data - En una implementación real, esto vendría de la base de datos
const documentData = {
  id: "1",
  name: "Factura de luz - Marzo 2025",
  type: "pdf",
  category: "Hogar",
}

export default function CompartirDocumentoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [shareMethod, setShareMethod] = useState<"link" | "email" | "qr">("link")
  const [accessDuration, setAccessDuration] = useState<"1day" | "7days" | "30days" | "unlimited">("7days")
  const [permissions, setPermissions] = useState({
    view: true,
    download: false,
    print: false,
    edit: false,
  })
  const [password, setPassword] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [emails, setEmails] = useState("")
  const [message, setMessage] = useState("")
  const [shareLink, setShareLink] = useState("")
  const [qrCodeData, setQrCodeData] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)

  const documentId = Array.isArray(params.id) ? params.id[0] : params.id

  const handleGenerateLink = async () => {
    setLoading(true)
    try {
      const shareOptions: ShareOptions = {
        documentId,
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
      }

      const result = await shareService.generateShareLink(shareOptions)

      if (result.success && result.shareLink) {
        setShareLink(result.shareLink)
        toast({
          title: "Enlace generado",
          description: "El enlace de compartir se ha generado correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el enlace de compartir.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al generar enlace:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el enlace de compartir.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast({
      title: "Enlace copiado",
      description: "El enlace se ha copiado al portapapeles.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateQR = async () => {
    setGeneratingQR(true)
    try {
      const shareOptions: ShareOptions = {
        documentId,
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
      }

      const result = await shareService.generateQRCode(shareOptions)

      if (result.success && result.qrCodeData) {
        setQrCodeData(result.qrCodeData)
        toast({
          title: "Código QR generado",
          description: "El código QR se ha generado correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el código QR.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al generar QR:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el código QR.",
        variant: "destructive",
      })
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleSendEmail = async () => {
    setLoading(true)
    try {
      if (!emails.trim()) {
        toast({
          title: "Error",
          description: "Por favor, ingresa al menos una dirección de correo electrónico.",
          variant: "destructive",
        })
        return
      }

      const emailList = emails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)

      const shareOptions: ShareOptions = {
        documentId,
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
        emails: emailList,
        message: message.trim() || undefined,
      }

      const result = await shareService.shareViaEmail(shareOptions)

      if (result.success) {
        toast({
          title: "Correo enviado",
          description: `El documento se ha compartido por correo con ${emailList.length} destinatario(s).`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el correo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al enviar correo:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el correo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    setLoading(true)
    try {
      let result

      if (shareMethod === "link") {
        if (!shareLink) {
          await handleGenerateLink()
        }
        result = { success: true }
      } else if (shareMethod === "email") {
        result = await handleSendEmail()
      } else if (shareMethod === "qr") {
        if (!qrCodeData) {
          await handleGenerateQR()
        }
        result = { success: true }
      }

      if (result?.success) {
        toast({
          title: "Documento compartido",
          description: "El documento se ha compartido exitosamente.",
        })
        router.push("/dashboard/compartidos")
      }
    } catch (error) {
      console.error("Error al compartir documento:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al compartir el documento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Compartir documento</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Opciones de compartir</CardTitle>
            <CardDescription>Configura cómo quieres compartir "{documentData.name}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={shareMethod} onValueChange={(v) => setShareMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>Enlace</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span>Código QR</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Enlace de compartir</Label>
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly placeholder="Genera un enlace para compartir" />
                    {shareLink ? (
                      <Button variant="outline" onClick={handleCopyLink} disabled={loading}>
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copiado
                          </>
                        ) : (
                          "Copiar"
                        )}
                      </Button>
                    ) : (
                      <Button onClick={handleGenerateLink} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          "Generar"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Correos electrónicos</Label>
                  <Textarea
                    id="emails"
                    placeholder="Ingresa las direcciones de correo separadas por comas"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes ingresar múltiples direcciones separadas por comas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Añade un mensaje personalizado"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <Button onClick={handleSendEmail} disabled={loading || !emails.trim()} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar por correo
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4 pt-4">
                <div className="flex flex-col items-center justify-center p-6 border rounded-md">
                  {qrCodeData ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <QRCodeCanvas value={qrCodeData} size={192} />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-muted flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">
                    {qrCodeData
                      ? "Escanea este código QR para acceder al documento"
                      : "Genera un código QR para compartir este documento"}
                  </p>
                  {!qrCodeData && (
                    <Button className="mt-4" onClick={handleGenerateQR} disabled={generatingQR}>
                      {generatingQR ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        "Generar código QR"
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Duración del acceso</h3>
                <RadioGroup
                  value={accessDuration}
                  onValueChange={(v) => setAccessDuration(v as any)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1day" id="1day" />
                    <Label htmlFor="1day">1 día</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7days" id="7days" />
                    <Label htmlFor="7days">7 días</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30days" id="30days" />
                    <Label htmlFor="30days">30 días</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlimited" id="unlimited" />
                    <Label htmlFor="unlimited">Sin límite</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Permisos</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="view">Ver documento</Label>
                    <Switch
                      id="view"
                      checked={permissions.view}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, view: checked })}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="download">Permitir descarga</Label>
                    <Switch
                      id="download"
                      checked={permissions.download}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, download: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="print">Permitir impresión</Label>
                    <Switch
                      id="print"
                      checked={permissions.print}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, print: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit">Permitir edición</Label>
                    <Switch
                      id="edit"
                      checked={permissions.edit}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, edit: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Protección con contraseña</h3>
                  <Switch id="use-password" checked={usePassword} onCheckedChange={setUsePassword} />
                </div>

                {usePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Ingresa una contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      La contraseña será requerida para acceder al documento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Compartir documento"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previsualización</CardTitle>
            <CardDescription>Así se verá el documento compartido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{documentData.name}</h3>
                  <p className="text-sm text-muted-foreground">{documentData.category}</p>
                </div>
              </div>

              <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Vista previa del documento</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compartido por:</span>
                  <span>Juan Pérez</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span>{shareMethod === "link" ? "Enlace" : shareMethod === "email" ? "Email" : "Código QR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración:</span>
                  <span>
                    {accessDuration === "1day"
                      ? "1 día"
                      : accessDuration === "7days"
                        ? "7 días"
                        : accessDuration === "30days"
                          ? "30 días"
                          : "Sin límite"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protegido:</span>
                  <span>{usePassword ? "Sí" : "No"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
