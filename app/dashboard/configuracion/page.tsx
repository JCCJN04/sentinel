// app/dashboard/configuracion/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { PlanSettings } from "@/components/settings/plan-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { PersonalDataSettings } from "@/components/settings/personal-data-settings"
import useMobile from "@/hooks/use-mobile" // Importa el hook que acabas de crear

export default function ConfiguracionPage() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState("perfil")
  const isMobile = useMobile()

  // Establecer la pestaña desde la URL al cargar
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const tabs = [
    { value: "perfil", label: "Perfil" },
    { value: "datos-personales", label: "Datos Personales" },
    { value: "seguridad", label: "Seguridad" },
    { value: "notificaciones", label: "Notificaciones" },
    { value: "plan", label: "Plan y facturación" },
    { value: "integraciones", label: "Integraciones" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de cuenta</h1>
        <p className="text-muted-foreground">Gestiona tu perfil, preferencias y configuración de seguridad.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una sección" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="perfil">
          <ProfileSettings />
        </TabsContent>

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