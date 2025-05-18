"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { PlanSettings } from "@/components/settings/plan-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("perfil")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de cuenta</h1>
        <p className="text-muted-foreground">Gestiona tu perfil, preferencias y configuración de seguridad.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="plan">Plan y facturación</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <ProfileSettings />
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
