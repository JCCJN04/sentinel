// components/dashboard/dashboard-stats.tsx
"use client"; // Esta directiva es crucial para que este componente funcione en el navegador

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentService } from "@/lib/document-service";
import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DocumentInsightsPanel } from "@/components/documentos/document-insights-panel";
import type { DocumentInsightData } from "@/components/documentos/document-insights-panel";

interface DashboardStatsProps {
  // Puedes pasar props si es necesario, por ejemplo, para filtros de tiempo
}

export function DashboardStats({}: DashboardStatsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentInsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar las estadísticas cuando el componente se monta
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true); // Inicia el estado de carga
      setError(null); // Limpia cualquier error previo
      try {
        const userStats = await documentService.getUserStats();
        const allDocuments = await documentService.getDocuments();
        
        // Transform documents to DocumentInsightData format
        const transformedDocs: DocumentInsightData[] = allDocuments.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          category: doc.category,
          expiry_date: doc.expiry_date,
          created_at: doc.created_at,
          file_size: doc.file_size,
        }));
        
        setDocuments(transformedDocs); // Guarda documentos para insights panel
      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err);
        // Captura el mensaje de error específico del servicio
        setError(err.message || "No se pudieron cargar las estadísticas del dashboard."); // Establece el mensaje de error
        toast({
          title: "Error de Carga",
          description: err.message || "No se pudieron cargar las estadísticas del dashboard.", // Usa el error específico en el toast
          variant: "destructive",
        });
      } finally {
        setIsLoading(false); // Finaliza el estado de carga
      }
    };
    fetchStats();
  }, [toast]); // Se ejecuta solo una vez al montar el componente, o si `toast` cambia (aunque `toast` es estable)

  // Muestra un estado de carga mientras se obtienen los datos
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => ( // Renderiza 4 tarjetas de esqueleto para el estado de carga
          <Card key={i} className="flex flex-col items-center justify-center p-6 h-32 animate-pulse bg-muted/50">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </Card>
        ))}
      </div>
    );
  }

  // Muestra un mensaje de error si la carga falló
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-red-600">
        <AlertCircle className="h-12 w-12 mb-2" />
        <p>{error}</p> {/* Muestra el mensaje de error específico */}
      </div>
    );
  }

  return (
    <>
      {/* Document Insights Panel - Replaces old stats cards */}
      <DocumentInsightsPanel documents={documents} />
    </>
  );
}
