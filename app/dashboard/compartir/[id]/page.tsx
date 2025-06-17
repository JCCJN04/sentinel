"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Link2, Mail, QrCode, Shield, FileText, Check, Loader2, CalendarIcon, CopyIcon } from "lucide-react";
import { shareService, type ShareServiceOptions, type ShareResult } from "@/lib/share-service"; 
import { documentService, type Document } from "@/lib/document-service"; 
import { useToast } from "@/components/ui/use-toast";
import { QRCodeCanvas } from "qrcode.react"; 
import { format } from 'date-fns';
import { cn } from "@/lib/utils"; // Ensure cn is imported

type ShareMethod = "link" | "email" | "qr";

export default function CompartirDocumentoPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id as string;

  const [documentInfo, setDocumentInfo] = useState<Document | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [shareMethod, setShareMethod] = useState<ShareMethod>("link");
  const [accessDuration, setAccessDuration] = useState<"1day" | "7days" | "30days" | "unlimited">("7days");
  const [permissions, setPermissions] = useState({
    view: true,
    download: false,
    print: false, 
    edit: false,
  });
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  
  const [shareLink, setShareLink] = useState("");
  const [qrCodeData, setQrCodeData] = useState(""); 
  
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (documentId) {
      setIsLoadingDocument(true);
      documentService.getDocumentById(documentId)
        .then(doc => {
          if (doc) {
            setDocumentInfo(doc);
          } else {
            setDocumentError("Documento no encontrado.");
            toast({ title: "Error", description: "Documento no encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Error fetching document:", err);
          setDocumentError("No se pudo cargar la información del documento.");
          toast({ title: "Error de Carga", description: "No se pudo cargar la información del documento.", variant: "destructive" });
        })
        .finally(() => setIsLoadingDocument(false));
    } else {
      setDocumentError("ID de documento no proporcionado en la URL.");
      setIsLoadingDocument(false);
      toast({ title: "Error", description: "ID de documento no válido.", variant: "destructive" });
    }
  }, [documentId, toast]);


  const activeShareOptions = (): ShareServiceOptions => {
    return {
        documentId: documentId!,
        accessDuration,
        permissions,
        password: usePassword && password.trim() !== "" ? password.trim() : undefined,
        emails: shareMethod === 'email' ? emails.split(",").map(e => e.trim()).filter(email => email && /\S+@\S+\.\S+/.test(email)) : undefined,
        message: shareMethod === 'email' ? message.trim() || undefined : undefined,
        customShareIdentifier: documentInfo?.name.replace(/\s+/g, '-').toLowerCase() || `doc-${documentId}`
    };
  };
  
  const handleMainShareAction = async () => {
    if (!documentId) {
        toast({ title: "Error", description: "ID de documento no válido.", variant: "destructive" });
        return;
    }
    const currentOptions = activeShareOptions();
    if (shareMethod === 'email' && (!currentOptions.emails || currentOptions.emails.length === 0)) {
        toast({ title: "Error", description: "Por favor, ingresa al menos un correo electrónico válido para compartir.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    setShareLink(""); // Reset previous link/qr
    setQrCodeData("");

    let result: ShareResult | null = null;

    try {
        if (shareMethod === "link") {
            result = await shareService.generateShareLink(currentOptions);
            if (result.success && result.shareLink) {
                setShareLink(result.shareLink);
                toast({ title: "Enlace Generado", description: "Enlace copiado al portapapeles." });
                try {
                    await navigator.clipboard.writeText(result.shareLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.warn("Fallo al copiar al portapapeles:", err);
                }
            }
        } else if (shareMethod === "email") {
            result = await shareService.shareViaEmail(currentOptions);
             if (result.success) {
                toast({ title: "Compartido por Email", description: `Solicitud de compartición enviada a: ${currentOptions.emails?.join(', ')}` });
            }
        } else if (shareMethod === "qr") {
            result = await shareService.generateQRCode(currentOptions);
            if (result.success && result.qrCodeData) {
                setQrCodeData(result.qrCodeData); 
                setShareLink(result.qrCodeData); 
                toast({ title: "Código QR Generado", description: "El QR está listo para ser escaneado." });
            }
        }

        if (result && !result.success) {
            toast({ title: "Error al Compartir", description: result.error || `No se pudo completar la acción de compartir (${shareMethod}).`, variant: "destructive" });
        }
    } catch (error: any) {
        console.error(`Error en handleMainShareAction (${shareMethod}):`, error);
        toast({ title: "Error Inesperado", description: error.message || "Ocurrió un error.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink)
    .then(() => {
        setCopied(true);
        toast({
          title: "Enlace copiado",
          description: "El enlace se ha copiado al portapapeles.",
        });
        setTimeout(() => setCopied(false), 2000);
    })
    .catch(err => {
        console.error("Error al copiar al portapapeles:", err);
        toast({ title: "Error al copiar", description: "No se pudo copiar el enlace.", variant: "destructive"});
    });
  }

  if (isLoadingDocument) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Cargando datos del documento...</p></div>;
  }
  if (documentError) {
    return <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <ArrowLeft className="h-12 w-12 mb-4"/>
        <p className="text-xl">{documentError}</p>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
    </div>;
  }
  if (!documentInfo) {
    return <div className="flex justify-center items-center h-screen"><p>No se encontró el documento.</p></div>;
  }

  const permissionsArray = [
    { key: "view", label: "Ver documento", disabled: true },
    { key: "download", label: "Permitir descarga" },
    { key: "print", label: "Permitir impresión" },
    { key: "edit", label: "Permitir edición (si aplica)" }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Compartir Documento</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-start">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Opciones para compartir</CardTitle>
            <CardDescription>Configura cómo quieres compartir: <span className="font-semibold text-primary">{documentInfo.name}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={shareMethod} onValueChange={(v) => {
                setShareMethod(v as ShareMethod);
                setShareLink(""); 
                setQrCodeData("");
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Link2 className="h-4 w-4" /><span>Enlace</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Mail className="h-4 w-4" /><span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <QrCode className="h-4 w-4" /><span>Código QR</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4 pt-4">
                {shareLink ? (
                    <div className="space-y-2">
                        <Label htmlFor="shareLinkInput">Enlace de compartir generado:</Label>
                        <div className="flex gap-2">
                        <Input id="shareLinkInput" value={shareLink} readOnly />
                        <Button variant="outline" onClick={handleCopyLink} disabled={isProcessing}>
                            {copied ? <Check className="mr-0 sm:mr-2 h-4 w-4" /> : <CopyIcon className="mr-0 sm:mr-2 h-4 w-4" />}
                            <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
                        </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Haz clic en "{(
                        shareMethod === "link" ? (shareLink ? "Enlace Generado ✓" : "Generar Enlace") :
                        shareMethod === "email" ? "Enviar por Email" :
                        shareMethod === "qr" ? (qrCodeData ? "QR Generado ✓" : "Generar Código QR") :
                        "Compartir"
                    )}" abajo para generar el enlace.</p>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Enviar a correos electrónicos</Label>
                  <Textarea
                    id="emails"
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa múltiples direcciones separadas por comas.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Echa un vistazo a este documento..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4 pt-4">
                <div className="flex flex-col items-center justify-center p-4 sm:p-6 border rounded-md">
                  {qrCodeData ? (
                    <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white p-2 rounded-md shadow">
                      <QRCodeCanvas value={qrCodeData} size={176} level="H" includeMargin={false} />
                    </div>
                  ) : (
                    <div className="w-40 h-40 sm:w-48 sm:h-48 bg-muted rounded-md flex items-center justify-center">
                      <QrCode className="h-20 w-20 sm:h-24 sm:w-24 text-muted-foreground" />
                    </div>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground text-center">
                    {qrCodeData
                      ? "Escanea este código QR para acceder al documento."
                      : `Haz clic en "${(
                          shareMethod === "link" ? (shareLink ? "Enlace Generado ✓" : "Generar Enlace") :
                          shareMethod === "email" ? "Enviar por Email" :
                          shareMethod === "qr" ? (qrCodeData ? "QR Generado ✓" : "Generar Código QR") :
                          "Compartir"
                      )}" abajo para generar el código QR.`}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-2 block">Duración del acceso</Label>
                <RadioGroup
                  value={accessDuration}
                  onValueChange={(v) => setAccessDuration(v as typeof accessDuration)}
                  className="grid grid-cols-2 gap-x-4 gap-y-2"
                  disabled={isProcessing}
                >
                  {[
                    { value: "1day", label: "1 día" }, { value: "7days", label: "7 días" },
                    { value: "30days", label: "30 días" }, { value: "unlimited", label: "Sin límite" }
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium mb-2 block">Permisos del destinatario</Label>
                <div className="space-y-3">
                  {permissionsArray.map(perm => {
                    // Agregamos un console.log para depurar el objeto perm
                    // console.log("Rendering permission:", perm); 
                    return (
                        <div key={perm.key} className="flex items-center justify-between">
                        <Label 
                            htmlFor={`perm-${perm.key}`} 
                            className={cn(
                                "cursor-pointer", 
                                {"text-muted-foreground": perm.disabled} // Usando objeto para cn
                            )}
                        >
                            {perm.label}
                        </Label>
                        <Switch
                            id={`perm-${perm.key}`}
                            checked={permissions[perm.key as keyof typeof permissions]}
                            onCheckedChange={(checked) => {
                                if (!perm.disabled) { // Solo actualiza si no está deshabilitado (view está deshabilitado)
                                    setPermissions(prev => ({ ...prev, [perm.key]: checked }));
                                }
                            }}
                            disabled={isProcessing || perm.disabled}
                        />
                        </div>
                    );
                  })}
                </div>
              </div>

              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="use-password-switch" className="text-base font-medium">Protección con contraseña</Label>
                  <Switch id="use-password-switch" checked={usePassword} onCheckedChange={setUsePassword} disabled={isProcessing} />
                </div>
                {usePassword && (
                  <div className="space-y-1 mt-2">
                    <Label htmlFor="password">Establecer Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Ingresa una contraseña segura"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6">
            <Button variant="outline" onClick={() => router.back()} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
                onClick={handleMainShareAction} 
                disabled={isProcessing || (shareMethod === 'email' && (!emails.trim() || !emails.split(",").map(e => e.trim()).filter(Boolean).length))}
                className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                shareMethod === "link" ? (shareLink ? "Enlace Generado ✓" : "Generar Enlace") :
                shareMethod === "email" ? "Enviar por Email" :
                shareMethod === "qr" ? (qrCodeData ? "QR Generado ✓" : "Generar Código QR") :
                "Compartir"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hidden md:block sticky top-24">
             <CardHeader>
                <CardTitle className="text-lg">Documento a Compartir</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-card-foreground break-all">{documentInfo.name}</p>
                        <p className="text-xs text-muted-foreground">Categoría: {documentInfo.category}</p>
                    </div>
                </div>
                <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Previsualización no disponible</p>
                </div>
                <Separator/>
                <h4 className="font-medium text-muted-foreground">Configuración actual:</h4>
                <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Método:</span> <span className="font-medium">{shareMethod === "link" ? "Enlace" : shareMethod === "email" ? "Email" : "Código QR"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duración:</span> <span className="font-medium">{accessDuration === "1day" ? "1 día" : accessDuration === "7days" ? "7 días" : accessDuration === "30days" ? "30 días" : "Sin límite"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Contraseña:</span> <span className="font-medium">{usePassword && password ? "Sí" : "No"}</span></div>
                    <div className="text-muted-foreground">Permisos:
                        <ul className="list-disc list-inside pl-1">
                            {permissionsArray.filter(p => permissions[p.key as keyof typeof permissions]).map(p => <li key={p.key}>{p.label.replace("Permitir ", "")}</li>)}
                        </ul>
                    </div>
                </div>
             </CardContent>
        </Card>
      </div>
    </div>
  );
}