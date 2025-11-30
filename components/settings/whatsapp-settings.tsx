'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabaseBrowserClient } from '@/lib/supabase';
import { MessageCircle, Send, Check, AlertCircle } from 'lucide-react';

export function WhatsAppSettings() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const { toast } = useToast();

  // Cargar configuración actual
  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabaseBrowserClient.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabaseBrowserClient
        .from('profiles')
        .select('phone_number, whatsapp_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (profile) {
        setPhoneNumber(profile.phone_number || '');
        setNotificationsEnabled(profile.whatsapp_notifications_enabled || false);
      }
    }

    loadSettings();
  }, []);

  const handleTestMessage = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu número de WhatsApp primero',
        variant: 'destructive',
      });
      return;
    }

    setTestLoading(true);
    setTestSuccess(false);

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'test',
          phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestSuccess(true);
        toast({
          title: '✅ Mensaje enviado',
          description: 'Revisa tu WhatsApp. Si no llega, verifica el número.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo enviar el mensaje',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error enviando mensaje de prueba:', error);
      toast({
        title: 'Error',
        description: 'Error al enviar mensaje de prueba',
        variant: 'destructive',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu número de WhatsApp',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'configure',
          phoneNumber,
          enableNotifications: notificationsEnabled,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Configuración guardada',
          description: 'Tus preferencias de WhatsApp han sido actualizadas',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo guardar la configuración',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar configuración',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Recordatorios por WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Recibe notificaciones de tus medicamentos por WhatsApp
          </p>
        </div>
      </div>

      {/* Información importante */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-4">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-2">Configuración inicial requerida:</p>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
              <li>
                Envía un WhatsApp a <strong className="font-mono">+1 415 523 8886</strong> con el texto:
                <div className="mt-1 p-2 bg-white dark:bg-blue-900/50 rounded font-mono text-xs border border-blue-300 dark:border-blue-800">
                  join visit-whenever
                </div>
              </li>
              <li>Espera la confirmación de Twilio</li>
              <li>Ingresa tu número aquí con código de país (ej: +5218111230266)</li>
              <li>Activa los recordatorios y guarda</li>
            </ol>
            <p className="mt-3 text-xs">
              📱 Los recordatorios llegan 1 hora antes de cada dosis programada
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Campo de número de teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone">Número de WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+521234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Formato: código de país + número (sin espacios ni guiones)
          </p>
        </div>

        {/* Switch para habilitar notificaciones */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Recordatorios activos</Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones de medicamentos
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleTestMessage}
            variant="outline"
            disabled={testLoading || !phoneNumber}
            className="flex-1"
          >
            {testLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Enviando...
              </>
            ) : testSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Mensaje Enviado
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Prueba
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || !phoneNumber}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Estado de verificación */}
      {testSuccess && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 p-4">
          <div className="flex gap-2">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="text-sm text-green-900 dark:text-green-100">
              <p className="font-semibold">Número verificado</p>
              <p className="text-green-800 dark:text-green-200">
                Tu número está configurado correctamente. Recibirás recordatorios por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
