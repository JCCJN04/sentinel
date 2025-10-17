// app/s/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSharedDocumentByLinkId, SharedDocumentResponse } from '@/lib/share-service';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Download, Clock, FileText, ShieldCheck } from 'lucide-react';
import { supabaseBrowserClient as supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Función auxiliar para generar URLs firmadas y seguras
async function generateSignedUrl(filePath: string, download: boolean = false): Promise<string | null> {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 300, { download });
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
}

export default function SharedDocumentViewerPage() {
  const params = useParams();
  const linkId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedDocumentResponse | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!linkId) return;

    getSharedDocumentByLinkId(linkId)
      .then(async ({ data: responseData, error: responseError }) => {
        if (responseError) {
          setError(responseError);
        } else if (responseData) {
          setData(responseData);
          const previewUrl = await generateSignedUrl(responseData.document.file_path, false);
          if(!previewUrl) throw new Error("No se pudo cargar la vista previa del archivo.");
          setFileUrl(previewUrl);
        }
      })
      .catch((err) => setError(err.message || 'Ocurrió un error inesperado.'))
      .finally(() => setIsLoading(false));
  }, [linkId]);

  const handleDownload = async () => {
    if (!data || !data.shareDetails.can_download) return;
    setIsDownloading(true);
    try {
        const downloadUrl = await generateSignedUrl(data.document.file_path, true);
        if (downloadUrl) {
          window.open(downloadUrl, '_self');
        } else {
          throw new Error("No se pudo generar el enlace de descarga.");
        }
    } catch (err: any) {
        toast({ title: "Error de descarga", description: err.message, variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };
  
  if (isLoading) {
    return (
      <main className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg">Cargando documento seguro...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
       <main className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 text-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Acceso Denegado</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">{error}</p>
            <Button variant="link" className="mt-4" onClick={() => window.location.href = '/'}>Ir a la página principal</Button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const timeLeft = formatDistanceToNow(new Date(data.shareDetails.expires_at), { addSuffix: true, locale: es });
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(data.document.file_type?.toLowerCase() || '');

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      
      <header className="flex-shrink-0 bg-white dark:bg-slate-950/70 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 p-3 z-10">
        <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="font-semibold text-base md:text-lg truncate" title={data.document.name}>
                    {data.document.name}
                </span>
            </div>
            {data.shareDetails.can_download && (
                <Button onClick={handleDownload} disabled={isDownloading} size="sm" className="flex-shrink-0">
                    <Download className="mr-0 sm:mr-2 h-4 w-4"/>
                    <span className="hidden sm:inline">Descargar</span>
                </Button>
            )}
        </div>
      </header>
      
      {/* --- INICIO DE LA CORRECCIÓN DEL VISOR --- */}
      {/* Se habilita el scroll vertical en el área principal */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8">
        {fileUrl ? (
          isImage ? (
            // VISOR DE IMAGEN: Se ajusta al ancho y permite scroll vertical
            <div className="w-full max-w-5xl mx-auto">
              <img
                src={fileUrl}
                alt={data.document.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            // VISOR DE DOCUMENTOS (PDF): Usa un aspect ratio natural y permite scroll
            <div className="w-full max-w-5xl mx-auto">
                <div className="aspect-[8.5/11] w-full bg-white dark:bg-black rounded-lg shadow-xl overflow-hidden">
                    <iframe
                        src={fileUrl}
                        className="w-full h-full border-none"
                        title={data.document.name}
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
      {/* --- FIN DE LA CORRECCIÓN DEL VISOR --- */}

      <footer className="flex-shrink-0 text-center p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2"><Clock className="h-4 w-4"/> Este enlace expira {timeLeft}.</p>
        <p className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600"/> Compartido de forma segura.</p>
      </footer>
    </div>
  );
}