'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateReminderStatus, type UnifiedAlert } from '@/lib/actions/alerts.actions';
import { AlertTriangle, Users, ShieldCheck, CheckCircle, Clock, Loader2, type LucideIcon } from 'lucide-react';

const alertMetadata: Record<UnifiedAlert['type'], { icon: LucideIcon, color: string }> = {
  document_reminder: { icon: AlertTriangle, color: 'text-yellow-500' },
  family_activity: { icon: Users, color: 'text-blue-500' },
  security_alert: { icon: ShieldCheck, color: 'text-red-500' },
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
        <div className="text-center text-muted-foreground p-8">
          No hay alertas en esta categoría.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((alert) => {
          const metadata = alertMetadata[alert.type];
          const Icon = metadata.icon;

          const AlertBody = (
            <div className="flex items-start space-x-4">
              <div className="mt-1"><Icon className={cn("h-5 w-5", metadata.color)} /></div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              {alert.type === 'document_reminder' && alert.status === 'pendiente' && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); handleUpdateStatus(alert.id, 'pospuesta'); }} disabled={loadingAction === alert.id}>
                    {loadingAction === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" onClick={(e) => { e.preventDefault(); handleUpdateStatus(alert.id, 'completada'); }} disabled={loadingAction === alert.id}>
                    {loadingAction === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          );

          return (
            <Card key={alert.id} className={cn(alert.status !== 'pendiente' && alert.status !== 'info' && 'opacity-60')}>
              <CardContent className="p-0">
                {alert.link ? (
                  <Link href={alert.link} className="block p-4 hover:bg-muted/50 rounded-lg">
                    {AlertBody}
                  </Link>
                ) : (
                  <div className="p-4">{AlertBody}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
        <TabsTrigger value="informativas">Informativas</TabsTrigger>
        <TabsTrigger value="completadas">Historial</TabsTrigger>
      </TabsList>
      <TabsContent value="pendientes" className="mt-4">
        {renderAlerts(['pendiente'])}
      </TabsContent>
      <TabsContent value="informativas" className="mt-4">
        {renderAlerts(['info'])}
      </TabsContent>
      <TabsContent value="completadas" className="mt-4">
        {renderAlerts(['completada', 'pospuesta'])}
      </TabsContent>
    </Tabs>
  );
}