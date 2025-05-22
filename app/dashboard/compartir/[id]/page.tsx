"use client"

import { useState, useEffect } from "react" // Added useEffect for potential early check, though not strictly used in this version for redirection
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
import { shareService, type ShareOptions } from "@/lib/share-service" // Assuming share-service is now correctly importing supabase
import { useToast } from "@/components/ui/use-toast"
import { QRCodeCanvas } from "qrcode.react"

// Mock document data - En una implementación real, esto vendría de la base de datos
const documentData = {
  id: "1", // This will be overridden by actual params.id if used for display
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

  // Get the document ID from params.
  // This can be string | string[] | undefined initially.
  const getDocumentIdFromParams = () => {
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }

  // You could also fetch actual document details here based on documentId
  // For now, we'll use the mock data for display name, but the ID for sharing.
  const pageDocumentId = getDocumentIdFromParams();
  const displayedDocumentName = pageDocumentId ? `Documento ID: ${pageDocumentId}` : documentData.name; // Or fetch actual name

  const handleGenerateLink = async () => {
    const documentId = getDocumentIdFromParams();
    if (!documentId) {
      toast({ title: "Error", description: "ID de documento no válido o faltante.", variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const shareOptions: ShareOptions = {
        documentId, // Now this is confirmed to be a string
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
      };

      const result = await shareService.generateShareLink(shareOptions);

      if (result.success && result.shareLink) {
        setShareLink(result.shareLink);
        toast({
          title: "Enlace generado",
          description: "El enlace de compartir se ha generado correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el enlace de compartir.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al generar enlace:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el enlace de compartir.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({
      title: "Enlace copiado",
      description: "El enlace se ha copiado al portapapeles.",
    });
    setTimeout(() => setCopied(false), 2000);
  }

  const handleGenerateQR = async () => {
    const documentId = getDocumentIdFromParams();
    if (!documentId) {
      toast({ title: "Error", description: "ID de documento no válido o faltante.", variant: "destructive" });
      setGeneratingQR(false);
      return;
    }

    setGeneratingQR(true);
    try {
      const shareOptions: ShareOptions = {
        documentId, // Confirmed string
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
      };

      // Assuming generateQRCode might internally call generateShareLink or similar logic
      // that returns qrCodeData based on a generated link.
      // If shareService.generateQRCode generates its own link/data, this is fine.
      // For this example, let's assume it uses the same shareOptions.
      const result = await shareService.generateQRCode(shareOptions); // Or generateShareLink then make QR

      if (result.success && result.qrCodeData) { // Ensure your service returns qrCodeData
        setQrCodeData(result.qrCodeData);
        // If generateQRCode implicitly creates a share link, you might want to set it too
        if(result.shareLink) setShareLink(result.shareLink);
        toast({
          title: "Código QR generado",
          description: "El código QR se ha generado correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el código QR.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al generar QR:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el código QR.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQR(false);
    }
  }

  const handleSendEmail = async () => {
    const documentId = getDocumentIdFromParams();
    if (!documentId) {
      toast({ title: "Error", description: "ID de documento no válido o faltante.", variant: "destructive" });
      setLoading(false); // Assuming general loading state for this button
      return;
    }

    if (!emails.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa al menos una dirección de correo electrónico.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const emailList = emails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      if (emailList.length === 0) {
        toast({
            title: "Error",
            description: "Por favor, ingresa direcciones de correo válidas.",
            variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const shareOptions: ShareOptions = {
        documentId, // Confirmed string
        accessDuration,
        permissions,
        password: usePassword ? password : undefined,
        emails: emailList,
        message: message.trim() || undefined,
      };

      const result = await shareService.shareViaEmail(shareOptions);

      if (result.success) {
        toast({
          title: "Correo enviado",
          description: `El documento se ha compartido por correo con ${emailList.length} destinatario(s).`,
        });
         // If shareViaEmail implicitly creates a share link, you might want to set it
        if(result.shareLink) setShareLink(result.shareLink);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el correo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al enviar correo:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el correo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Main share button handler (optional, if you have a single "Compartir" button that decides action based on tab)
  const handleShare = async () => {
    const documentId = getDocumentIdFromParams();
    if (!documentId) {
        toast({ title: "Error", description: "ID de documento no válido o faltante.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        let result; // Define result type more accurately if possible based on your service
        let success = false;
        let finalShareLink = shareLink; // Keep existing link if already generated

        if (shareMethod === "link") {
            if (!finalShareLink) {
                const linkResult = await shareService.generateShareLink({
                    documentId, accessDuration, permissions, password: usePassword ? password : undefined
                });
                if (linkResult.success && linkResult.shareLink) {
                    setShareLink(linkResult.shareLink);
                    finalShareLink = linkResult.shareLink;
                    success = true;
                } else {
                    toast({ title: "Error", description: linkResult.error || "No se pudo generar el enlace.", variant: "destructive" });
                    setLoading(false);
                    return;
                }
            } else {
                success = true; // Link already exists
            }
        } else if (shareMethod === "email") {
            const emailResult = await shareService.shareViaEmail({
                documentId, accessDuration, permissions, password: usePassword ? password : undefined,
                emails: emails.split(",").map(e => e.trim()).filter(Boolean),
                message: message.trim() || undefined
            });
             if (emailResult.success) {
                success = true;
                if(emailResult.shareLink) setShareLink(emailResult.shareLink); // Update link if service returns it
            } else {
                 toast({ title: "Error", description: emailResult.error || "No se pudo enviar el correo.", variant: "destructive" });
                 setLoading(false);
                 return;
            }
        } else if (shareMethod === "qr") {
            if (!qrCodeData) { // Generate QR if not already done
                const qrResult = await shareService.generateQRCode({ // Assuming this function returns qrCodeData and potentially the shareLink
                    documentId, accessDuration, permissions, password: usePassword ? password : undefined
                });
                if (qrResult.success && qrResult.qrCodeData) {
                    setQrCodeData(qrResult.qrCodeData);
                    if(qrResult.shareLink) setShareLink(qrResult.shareLink); // Update link
                    success = true;
                } else {
                    toast({ title: "Error", description: qrResult.error || "No se pudo generar el código QR.", variant: "destructive" });
                    setLoading(false);
                    return;
                }
            } else {
                success = true; // QR already generated
            }
        }

        if (success) {
            toast({
                title: "Documento compartido",
                description: "El documento se ha compartido exitosamente.",
            });
            router.push("/dashboard/compartidos"); // Navigate on success
        }
        // If not success, specific toasts should have already been shown by sub-handlers
    } catch (error) {
        console.error("Error al compartir documento:", error);
        toast({
            title: "Error General",
            description: "Ocurrió un error al compartir el documento.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
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
            <CardDescription>Configura cómo quieres compartir "{displayedDocumentName}"</CardDescription>
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
                  <Label htmlFor="shareLinkInput">Enlace de compartir</Label>
                  <div className="flex gap-2">
                    <Input id="shareLinkInput" value={shareLink} readOnly placeholder="Genera un enlace para compartir" />
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
                {/* Button to send email, can be part of the main "Compartir" button logic or standalone */}
                {/* <Button onClick={handleSendEmail} disabled={loading || !emails.trim()} className="w-full"> ... </Button> */}
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
                    <Label htmlFor="view" className="cursor-pointer">Ver documento</Label>
                    <Switch
                      id="view"
                      checked={permissions.view}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, view: checked })}
                      disabled // Usually view is always true and disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="download" className="cursor-pointer">Permitir descarga</Label>
                    <Switch
                      id="download"
                      checked={permissions.download}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, download: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="print" className="cursor-pointer">Permitir impresión</Label>
                    <Switch
                      id="print"
                      checked={permissions.print}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, print: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit" className="cursor-pointer">Permitir edición</Label>
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
            <Button variant="outline" onClick={() => router.back()} disabled={loading || generatingQR}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={loading || generatingQR || (shareMethod === 'email' && !emails.trim())}>
              {(loading || generatingQR) ? (
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
                  <h3 className="font-medium">{displayedDocumentName}</h3>
                  <p className="text-sm text-muted-foreground">{documentData.category}</p>
                </div>
              </div>

              <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Vista previa del documento</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compartido por:</span>
                  <span>Juan Pérez</span>{/* Replace with actual user data */}
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