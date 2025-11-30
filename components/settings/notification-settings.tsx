"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { WhatsAppSettings } from "@/components/settings/whatsapp-settings"

export function NotificationSettings() {

  return (
    <div className="space-y-6">
      {/* Sección de WhatsApp - Funcionalidad activa */}
      <WhatsAppSettings />

      {/* Nota informativa */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones del Sistema</CardTitle>
          <CardDescription>
            Las notificaciones de medicamentos y alertas se envían automáticamente por WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Recordatorios activos:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>Medicamentos: 1 hora antes de cada dosis</li>
                  <li>Documentos: Alertas de vencimiento próximo</li>
                  <li>Alertas de seguridad automáticas</li>
                </ul>
              </div>
            </div>

            <div className="text-center p-8 text-muted-foreground">
              <p className="text-sm">
                Configura tu WhatsApp arriba para recibir todos los recordatorios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
