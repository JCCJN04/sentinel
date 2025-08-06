// components/dashboard/recent-documents.tsx
"use client"; // Esta directiva es necesaria para usar hooks de React

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { documentService, type Document } from "@/lib/document-service";
import { Loader2, FileText, FileWarning, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns"; // Para formatear la fecha

export function RecentDocuments() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar los documentos recientes
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true); // Inicia el estado de carga
      setError(null); // Limpia cualquier error previo
      try {
        // Obtiene los 5 documentos más recientes
        const fetchedDocuments = await documentService.getRecentDocuments(5);
        setDocuments(fetchedDocuments); // Actualiza el estado con los documentos
      } catch (err: any) {
        console.error("Error fetching recent documents:", err);
        setError("No se pudieron cargar los documentos recientes."); // Establece el mensaje de error
        toast({
          title: "Error de Carga",
          description: "No se pudieron cargar los documentos recientes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false); // Finaliza el estado de carga
      }
    };
    fetchDocuments();
  }, [toast]); // Se ejecuta al montar el componente

  return (
    // La tarjeta ocupa una columna en pantallas pequeñas y más en grandes
    <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle>Documentos Recientes</CardTitle>
        <CardDescription>Los últimos documentos que has subido o modificado.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Muestra un indicador de carga
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando documentos...</p>
          </div>
        ) : error ? (
          // Muestra un mensaje de error si la carga falló
          <div className="flex flex-col items-center justify-center h-32 text-red-600">
            <FileWarning className="h-8 w-8 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          // Muestra un mensaje si no hay documentos recientes
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay documentos recientes.</p>
            <p className="text-sm">¡Sube tu primer documento para empezar!</p>
          </div>
        ) : (
          // Muestra la lista de documentos como tarjetas
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/dashboard/documentos/${doc.id}`} className="block">
                <div className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" /> {/* Icono del documento */}
                  <div className="flex-grow">
                    <p className="font-medium text-sm truncate">{doc.name}</p> {/* Nombre del documento */}
                    <p className="text-xs text-muted-foreground">
                      {doc.category} - {format(new Date(doc.created_at), "dd/MM/yyyy")} {/* Categoría y fecha */}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" /> {/* Flecha indicadora */}
                </div>
              </Link>
            ))}
            {/* Botón para ver todos los documentos */}
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link href="/dashboard/documentos">Ver todos los documentos</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
