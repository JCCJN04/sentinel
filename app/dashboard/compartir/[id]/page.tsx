// app/dashboard/compartir/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentService, type Document } from '@/lib/document-service';
import { createShareLink } from '@/lib/share-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Share2, Copy, Check, QrCode, Download, Eye, KeyRound } from 'lucide-react';
import QRCode from 'qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ShareDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expiryDuration, setExpiryDuration] = useState<string>('1_hour');
  const [canDownload, setCanDownload] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // NUEVO: Estados para el enlace, token y QR
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (documentId) {
      documentService.getDocumentById(documentId)
        .then(doc => { if (doc) setDocument(doc); else setError('Documento no encontrado.'); })
        .catch(() => setError('Error al cargar el documento.'))
        .finally(() => setIsLoading(false));
    }
  }, [documentId]);

  const expiryOptions = useMemo(() => [
    { value: '1_hour', label: '1 Hora' }, { value: '24_hours', label: '24 Horas' },
    { value: '7_days', label: '7 Días' }, { value: '30_days', label: '30 Días' },
  ], []);

  const handleGenerateLink = async () => {
    if (!document) return;
    setIsGenerating(true);
    setSharedLink(null);
    setAccessToken(null);
    setQrCodeDataUrl(null);
    const [amount, unit] = expiryDuration.split('_');
    
    try {
      const result = await createShareLink(document.id, parseInt(amount), unit as 'hour' | 'days', canDownload);
      if (result.link) {
        const fullUrl = `${window.location.origin}/s/${result.link.id}`;
        setSharedLink(fullUrl);
        setAccessToken(result.link.access_token); // NUEVO: Guardar el token
        toast({ title: "Éxito", description: "Enlace y token generados." });
        const qrUrl = await QRCode.toDataURL(fullUrl, { width: 256, margin: 2 });
        setQrCodeDataUrl(qrUrl);
      } else {
        throw new Error(result.error || 'Error desconocido al crear el enlace.');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
      <Card>
        <CardHeader>
          <CardTitle>Compartir Documento</CardTitle>
          <CardDescription>Estás compartiendo: <strong>{document?.name}</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="expiry-duration">El enlace expirará en</Label>
            <Select value={expiryDuration} onValueChange={setExpiryDuration}>
              <SelectTrigger id="expiry-duration"><SelectValue /></SelectTrigger>
              <SelectContent>{expiryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-2">
                    {canDownload ? <Download className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <div>
                        <p className="text-sm font-medium">Permitir descarga</p>
                        <p className="text-xs text-muted-foreground">{canDownload ? "El receptor podrá ver y descargar." : "El receptor solo podrá ver."}</p>
                    </div>
                </div>
                <Switch checked={canDownload} onCheckedChange={setCanDownload} />
            </div>
          </div>
          <Button onClick={handleGenerateLink} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            {sharedLink ? 'Generar Nuevo Enlace y Token' : 'Generar Enlace Seguro'}
          </Button>

          {sharedLink && accessToken && (
            <div className="space-y-4 pt-4 border-t">
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertTitle>¡Importante!</AlertTitle>
                <AlertDescription>
                  Comparte el enlace y el token de 6 dígitos. El receptor necesitará ambos para acceder al documento.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Token de Acceso (6 dígitos)</Label>
                <div className="flex items-center gap-2">
                  <Input value={accessToken} readOnly className="text-lg font-bold tracking-widest text-center" />
                  <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(accessToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Enlace para Compartir</Label>
                <div className="flex items-center gap-2">
                  <Input value={sharedLink} readOnly />
                  <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(sharedLink)}>
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {qrCodeDataUrl && (
                 <div className="text-center p-4 bg-muted rounded-md">
                    <Label className="flex items-center justify-center mb-2"><QrCode className="mr-2 h-4 w-4"/> Código QR (Solo contiene el enlace)</Label>
                    <img src={qrCodeDataUrl} alt="Código QR del enlace" className="mx-auto border rounded-lg" />
                 </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}