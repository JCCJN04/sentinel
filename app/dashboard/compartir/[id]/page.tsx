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
import { Switch } from '@/components/ui/switch'; // NUEVO: Importar Switch
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Share2, Copy, Check, QrCode, Download, Eye } from 'lucide-react';
import QRCode from 'qrcode';

export default function ShareDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expiryDuration, setExpiryDuration] = useState<string>('1_hour');
  const [canDownload, setCanDownload] = useState<boolean>(true); // NUEVO: Estado para el permiso
  const [isGenerating, setIsGenerating] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);
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
    setQrCodeDataUrl(null);
    const [amount, unit] = expiryDuration.split('_');
    
    try {
      // NUEVO: Pasar el permiso `canDownload` al servicio
      const result = await createShareLink(document.id, parseInt(amount), unit as 'hour' | 'days', canDownload);
      if (result.link) {
        const fullUrl = `${window.location.origin}/s/${result.link.id}`;
        setSharedLink(fullUrl);
        toast({ title: "Éxito", description: "Enlace para compartir generado." });
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

  const handleCopyToClipboard = () => {
    if (!sharedLink) return;
    navigator.clipboard.writeText(sharedLink);
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

          {/* --- INICIO DE LA MODIFICACIÓN: Switch de Permisos --- */}
          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-2">
                    {canDownload ? <Download className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <div>
                        <p className="text-sm font-medium">Permitir descarga</p>
                        <p className="text-xs text-muted-foreground">
                            {canDownload ? "El receptor podrá ver y descargar el archivo." : "El receptor solo podrá ver el archivo."}
                        </p>
                    </div>
                </div>
                <Switch checked={canDownload} onCheckedChange={setCanDownload} />
            </div>
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          <Button onClick={handleGenerateLink} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            {sharedLink ? 'Generar Nuevo Enlace' : 'Generar Enlace Seguro'}
          </Button>

          {sharedLink && (
            <div className="space-y-4 pt-4 border-t">
              <Label>Enlace Generado</Label>
              <div className="flex items-center gap-2">
                <Input value={sharedLink} readOnly />
                <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {qrCodeDataUrl && (
                 <div className="text-center p-4 bg-muted rounded-md">
                    <Label className="flex items-center justify-center mb-2"><QrCode className="mr-2 h-4 w-4"/> Código QR</Label>
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