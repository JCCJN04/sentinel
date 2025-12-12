'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Smartphone, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface WhatsAppAlertsStatusProps {
  userId: string;
}

export function WhatsAppAlertsStatus({ userId }: WhatsAppAlertsStatusProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_notifications_enabled, phone_number')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setIsEnabled(data?.whatsapp_notifications_enabled || false);
      setPhoneNumber(data?.phone_number || null);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleNotifications(enabled: boolean) {
    if (enabled && !phoneNumber) {
      toast({
        title: 'Número de teléfono requerido',
        description: 'Configura tu número de WhatsApp en tu perfil primero',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_notifications_enabled: enabled })
        .eq('id', userId);

      if (error) throw error;

      setIsEnabled(enabled);
      toast({
        title: enabled ? '✅ Notificaciones activadas' : 'Notificaciones desactivadas',
        description: enabled 
          ? 'Recibirás recordatorios de medicamentos por WhatsApp'
          : 'Ya no recibirás notificaciones por WhatsApp',
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Solo mostrar el componente si NO hay número de teléfono configurado
  if (phoneNumber && isEnabled) {
    return null;
  }

  return (
    <Card className={cn(
      'border-2 transition-all hover:shadow-lg',
      isEnabled 
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900/40 dark:from-green-950/40 dark:to-emerald-950/40'
        : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/40 dark:to-orange-950/40'
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'rounded-xl p-3 shadow-lg',
              phoneNumber
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-600'
            )}>
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Alertas WhatsApp
                {phoneNumber ? (
                  isEnabled ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <BellOff className="mr-1 h-3 w-3" />
                      Inactivo
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-amber-500">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Configuración requerida
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {phoneNumber 
                  ? `Notificaciones a ${phoneNumber}`
                  : 'Configura tu número en el perfil'
                }
              </CardDescription>
            </div>
          </div>
          
          {phoneNumber && (
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleNotifications}
              disabled={isSaving}
              className="data-[state=checked]:bg-green-500"
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {phoneNumber ? (
            <>
              <div className="flex items-start gap-3 rounded-lg bg-white/50 dark:bg-black/20 p-3">
                <Bell className={cn(
                  'h-5 w-5 mt-0.5',
                  isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                )} />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Recordatorios de medicamentos</p>
                  <p className="text-xs text-muted-foreground">
                    Recibirás una notificación 1 hora antes de cada dosis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-white/50 dark:bg-black/20 p-3">
                <AlertCircle className={cn(
                  'h-5 w-5 mt-0.5',
                  isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                )} />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Alertas urgentes</p>
                  <p className="text-xs text-muted-foreground">
                    Notificación inmediata para dosis atrasadas
                  </p>
                </div>
              </div>

              {isEnabled && (
                <div className="rounded-lg border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-3 mt-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Sistema de notificaciones activo
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Las alertas se envían automáticamente según tus horarios programados
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-2">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Número de teléfono no configurado
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    Ve a tu perfil y agrega tu número de WhatsApp para recibir notificaciones automáticas de tus medicamentos
                  </p>
                  <Button
                    size="default"
                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                    onClick={() => window.location.href = '/dashboard/configuracion?tab=notificaciones'}
                  >
                    Ir a configuración de notificaciones
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
