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
            Servicio premium de notificaciones por WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                  ✨ Notificaciones Premium Activas
                </p>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-200">
                  <li>💊 Medicamentos: Recordatorio 1 hora antes de cada dosis</li>
                  <li>📄 Documentos: Alertas de vencimiento (7 días antes)</li>
                  <li>🔔 Alertas de seguridad automáticas</li>
                  <li>✅ Confirmaciones de acciones importantes</li>
                  <li>📱 Enviado desde WhatsApp Business oficial</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 text-center">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                🚀 Servicio de notificaciones profesional incluido
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Configura tu número de WhatsApp arriba para comenzar a recibir recordatorios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
