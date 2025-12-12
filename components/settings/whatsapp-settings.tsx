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
      // Auto-agregar +52 si el usuario solo ingresó números sin código de país
      let formattedPhone = phoneNumber.trim();
      if (/^\d{10}$/.test(formattedPhone)) {
        // Si son exactamente 10 dígitos, agregar +52 (México - sin el 1)
        formattedPhone = `+52${formattedPhone}`;
        setPhoneNumber(formattedPhone);
        toast({
          title: 'Número formateado',
          description: 'Se agregó automáticamente el código +52 de México',
        });
      } else if (/^\d+$/.test(formattedPhone) && !formattedPhone.startsWith('+')) {
        // Si son solo números pero no empieza con +, agregar +
        formattedPhone = `+${formattedPhone}`;
        setPhoneNumber(formattedPhone);
      }
      
      // Corregir formato mexicano: +521XXXXXXXXXX -> +52XXXXXXXXXX
      if (formattedPhone.startsWith('+521') && formattedPhone.length === 14) {
        formattedPhone = '+52' + formattedPhone.slice(4);
        setPhoneNumber(formattedPhone);
      }

      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'configure',
          phoneNumber: formattedPhone,
          enableNotifications: notificationsEnabled,
          sendWelcomeMessage: true, // Enviar mensaje automáticamente
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Configuración guardada',
          description: result.welcomeMessageSent 
            ? 'Configuración guardada y mensaje de bienvenida enviado a WhatsApp'
            : 'Tus preferencias de WhatsApp han sido actualizadas',
        });
        // Marcar como exitoso para mostrar el indicador de verificación
        setTestSuccess(true);
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
      <div className="space-y-4">
        {/* Campo de número de teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone">Número de WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="8112345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="font-mono"
          />
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

        {/* Botón de acción */}
        <div>
          <Button
            onClick={handleSave}
            disabled={loading || !phoneNumber}
            className="w-full bg-green-600 hover:bg-green-700"
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
