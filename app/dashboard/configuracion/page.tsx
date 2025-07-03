// app/dashboard/configuracion/page.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { PlanSettings } from "@/components/settings/plan-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"
// Importa el nuevo componente que acabas de crear
import { PersonalDataSettings } from "@/components/settings/personal-data-settings"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("perfil")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de cuenta</h1>
        <p className="text-muted-foreground">Gestiona tu perfil, preferencias y configuración de seguridad.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Ajusta las columnas para el nuevo total de pestañas */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          {/* Añade el nuevo disparador para la pestaña de Datos Personales */}
          <TabsTrigger value="datos-personales">Datos Personales</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="plan">Plan y facturación</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <ProfileSettings />
        </TabsContent>

        {/* Añade el nuevo contenido para la pestaña */}
        <TabsContent value="datos-personales">
          <PersonalDataSettings />
        </TabsContent>

        <TabsContent value="seguridad">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notificaciones">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="plan">
          <PlanSettings />
        </TabsContent>

        <TabsContent value="integraciones">
          <IntegrationSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}