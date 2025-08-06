// components/dashboard/dashboard-stats.tsx
"use client"; // Esta directiva es crucial para que este componente funcione en el navegador

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentService } from "@/lib/document-service";
import { formatFileSize } from "@/lib/document-service"; // Asegúrate de importar esto
import { Loader2, FileText, Clock, HardDrive, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface DashboardStatsProps {
  // Puedes pasar props si es necesario, por ejemplo, para filtros de tiempo
}

export function DashboardStats({}: DashboardStatsProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentDocuments: 0,
    storageUsed: 0,
    storageLimit: 0,
    expiringDocuments: 0,
    activeAlerts: 0, // Asumiendo que esta métrica viene de algún lado
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar las estadísticas cuando el componente se monta
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true); // Inicia el estado de carga
      setError(null); // Limpia cualquier error previo
      try {
        const userStats = await documentService.getUserStats();
        setStats(userStats); // Actualiza el estado con las estadísticas obtenidas
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

  // Calcula el porcentaje de almacenamiento usado
  const storagePercentage = stats.storageLimit > 0 ? (stats.storageUsed / stats.storageLimit) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Tarjeta de Documentos Totales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documentos Totales</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recentDocuments} en la última semana
          </p>
        </CardContent>
      </Card>
      {/* Tarjeta de Próximos a Vencer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Documentos con fecha de caducidad cercana
          </p>
        </CardContent>
      </Card>
      {/* Tarjeta de Almacenamiento Usado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Almacenamiento Usado</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatFileSize(stats.storageUsed)}
          </div>
          <p className="text-xs text-muted-foreground">
            de {formatFileSize(stats.storageLimit)} ({storagePercentage.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>
      {/* Tarjeta de Alertas Activas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Recordatorios y notificaciones pendientes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
