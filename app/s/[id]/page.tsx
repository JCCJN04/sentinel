// app/s/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Download, Clock, FileText, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPublicSharedDocument, PublicSharedDocumentResponse } from '@/lib/actions/share.actions'; // NUEVO: Importar la Server Action

export default function SharedDocumentViewerPage() {
  const params = useParams();
  const linkId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicSharedDocumentResponse | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!linkId) {
        setError("ID de enlace no proporcionado.");
        setIsLoading(false);
        return;
    };

    // --- INICIO DE LA CORRECCIÓN ---
    // Ahora llamamos a la Server Action, que se ejecuta en el backend.
    getPublicSharedDocument(linkId)
      .then(response => {
        if (response.error) {
          setError(response.error);
        } else {
          setData(response.data);
        }
      })
      .catch((err) => {
        console.error("Error inesperado al llamar a la Server Action:", err);
        setError("Ocurrió un error inesperado al cargar el documento.");
      })
      .finally(() => {
        setIsLoading(false);
      });
    // --- FIN DE LA CORRECCIÓN ---
  }, [linkId]);

  const handleDownload = async () => {
    if (!data || !data.shareDetails.can_download) return;
    setIsDownloading(true);
    try {
        // Podemos re-usar la fileUrl que ya tenemos si aún es válida,
        // o generar una nueva específica para descarga si es necesario.
        // Por simplicidad, asumiremos que la URL funciona para descarga si se abre en una nueva pestaña.
        window.open(data.fileUrl, '_blank');
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
      
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8">
        {data.fileUrl ? (
          isImage ? (
            <div className="w-full max-w-5xl mx-auto">
              <img
                src={data.fileUrl}
                alt={data.document.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto">
                <div className="aspect-[8.5/11] w-full bg-white dark:bg-black rounded-lg shadow-xl overflow-hidden">
                    <iframe
                        src={data.fileUrl}
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

      <footer className="flex-shrink-0 text-center p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2"><Clock className="h-4 w-4"/> Este enlace expira {timeLeft}.</p>
        <p className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600"/> Compartido de forma segura.</p>
      </footer>
    </div>
  );
}