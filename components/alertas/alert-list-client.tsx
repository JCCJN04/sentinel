'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateReminderStatus, type UnifiedAlert } from '@/lib/actions/alerts.actions';
import { AlertTriangle, Users, ShieldCheck, CheckCircle, Clock, Loader2, type LucideIcon } from 'lucide-react';

const alertMetadata: Record<UnifiedAlert['type'], { icon: LucideIcon, color: string, bgColor: string }> = {
  document_reminder: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/40' },
  family_activity: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/40' },
  security_alert: { icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/40' },
};

const statusBadgeConfig = {
  pendiente: { label: 'Pendiente', variant: 'destructive' as const },
  info: { label: 'Información', variant: 'secondary' as const },
  completada: { label: 'Completada', variant: 'outline' as const },
  pospuesta: { label: 'Pospuesta', variant: 'outline' as const },
};

export function AlertListClient({ alerts }: { alerts: UnifiedAlert[] }) {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleUpdateStatus = async (alertId: string, status: 'completada' | 'pospuesta') => {
    setLoadingAction(alertId);
    const result = await updateReminderStatus(alertId, status);
    if (result.success) {
      toast.success(`Recordatorio marcado como ${status}.`);
    } else {
      toast.error(result.error);
    }
    setLoadingAction(null);
  };

  const renderAlerts = (filterStatus: UnifiedAlert['status'][]) => {
    const filtered = alerts.filter(alert => filterStatus.includes(alert.status));

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
          <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-full">
            <CheckCircle className="h-6 w-6 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            No hay alertas en esta categoría.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {filtered.map((alert) => {
          const metadata = alertMetadata[alert.type];
          const Icon = metadata.icon;
          const statusConfig = statusBadgeConfig[alert.status];

          const AlertBody = (
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
              <div className={cn("p-2 rounded-lg flex-shrink-0", metadata.bgColor)}>
                <Icon className={cn("h-5 w-5", metadata.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 break-words">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString('es-ES', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                  <Badge variant={statusConfig.variant} className="text-xs w-fit flex-shrink-0">
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              {alert.type === 'document_reminder' && alert.status === 'pendiente' && (
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleUpdateStatus(alert.id, 'pospuesta'); 
                    }} 
                    disabled={loadingAction === alert.id}
                    className="flex-1 sm:flex-none h-8 text-xs sm:text-sm gap-1"
                  >
                    {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                    <span className="hidden sm:inline">Posponer</span>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleUpdateStatus(alert.id, 'completada'); 
                    }} 
                    disabled={loadingAction === alert.id}
                    className="flex-1 sm:flex-none h-8 text-xs sm:text-sm gap-1"
                  >
                    {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    <span className="hidden sm:inline">Completar</span>
                  </Button>
                </div>
              )}
            </div>
          );

          return (
            <Card 
              key={alert.id} 
              className={cn(
                "border-slate-200 shadow-sm dark:border-slate-800 transition-opacity",
                alert.status !== 'pendiente' && alert.status !== 'info' && 'opacity-60'
              )}
            >
              <CardContent className="p-0">
                {alert.link ? (
                  <Link href={alert.link} className="block p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition">
                    {AlertBody}
                  </Link>
                ) : (
                  <div className="p-3 sm:p-4">{AlertBody}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const pendingCount = alerts.filter(a => a.status === 'pendiente').length;
  const infoCount = alerts.filter(a => a.status === 'info').length;
  const completedCount = alerts.filter(a => a.status === 'completada' || a.status === 'pospuesta').length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <TabsTrigger 
            value="pendientes"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Pendientes
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="informativas"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Info
            {infoCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {infoCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="completadas"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Historial
            {completedCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-slate-500 text-white text-xs rounded-full flex items-center justify-center">
                {completedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4 space-y-3 sm:space-y-4">
          {renderAlerts(['pendiente'])}
        </TabsContent>
        <TabsContent value="informativas" className="mt-4 space-y-3 sm:space-y-4">
          {renderAlerts(['info'])}
        </TabsContent>
        <TabsContent value="completadas" className="mt-4 space-y-3 sm:space-y-4">
          {renderAlerts(['completada', 'pospuesta'])}
        </TabsContent>
      </Tabs>
    </div>
  );
}