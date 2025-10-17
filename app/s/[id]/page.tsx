// app/s/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Download, Clock, FileText, ShieldCheck, KeyRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { verifyTokenAndGetDocument, PublicSharedDocumentResponse } from '@/lib/actions/share.actions';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SharedDocumentViewerPage() {
  const params = useParams();
  const linkId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // NUEVO: Estados para manejar el flujo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [documentData, setDocumentData] = useState<PublicSharedDocumentResponse | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleTokenVerification = async () => {
    if (tokenValue.length !== 6) {
      setError("El token debe tener 6 dígitos.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifyTokenAndGetDocument(linkId, tokenValue);
      if (response.error) {
        setError(response.error);
        setTokenValue(""); // Limpiar el input en caso de error
      } else {
        setDocumentData(response.data);
        setIsAuthenticated(true); // Éxito, cambiar a la vista del documento
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al verificar el token.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentData || !documentData.shareDetails.can_download) return;
    setIsDownloading(true);
    try {
        window.open(documentData.fileUrl, '_blank');
    } catch (err: any) {
        toast({ title: "Error de descarga", description: err.message, variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };

  // --- VISTA 1: FORMULARIO DE TOKEN ---
  if (!isAuthenticated) {
    return (
      <main className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-8 w-8 text-primary mb-2" />
            <CardTitle>Verificación Requerida</CardTitle>
            <CardDescription>Introduce el token de 6 dígitos para ver el documento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={tokenValue} onChange={(value) => setTokenValue(value)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm text-center text-destructive">{error}</p>}
            <Button onClick={handleTokenVerification} disabled={isLoading || tokenValue.length !== 6} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar y Abrir
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // --- VISTA 2: VISUALIZADOR DE DOCUMENTO (SI LA AUTENTICACIÓN ES CORRECTA) ---
  if (!documentData) return null; // No debería ocurrir si isAuthenticated es true

  const timeLeft = formatDistanceToNow(new Date(documentData.shareDetails.expires_at), { addSuffix: true, locale: es });
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(documentData.document.file_type?.toLowerCase() || '');

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="flex-shrink-0 bg-white dark:bg-slate-950/70 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 p-3 z-10">
        <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="font-semibold text-base md:text-lg truncate" title={documentData.document.name}>
                    {documentData.document.name}
                </span>
            </div>
            {documentData.shareDetails.can_download && (
                <Button onClick={handleDownload} disabled={isDownloading} size="sm" className="flex-shrink-0">
                    <Download className="mr-0 sm:mr-2 h-4 w-4"/>
                    <span className="hidden sm:inline">Descargar</span>
                </Button>
            )}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8">
        {documentData.fileUrl ? (
          isImage ? (
            <div className="w-full max-w-5xl mx-auto">
              <img
                src={documentData.fileUrl}
                alt={documentData.document.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto">
                <div className="aspect-[8.5/11] w-full bg-white dark:bg-black rounded-lg shadow-xl overflow-hidden">
                    <iframe
                        src={documentData.fileUrl}
                        className="w-full h-full border-none"
                        title={documentData.document.name}
                    />
                </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p>Cargando vista previa segura...</p>
          </div>
        )}
      </main>

      <footer className="flex-shrink-0 text-center p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2"><Clock className="h-4 w-4"/> Este enlace expira {timeLeft}.</p>
        <p className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600"/> Compartido de forma segura.</p>
      </footer>
    </div>
  );
}