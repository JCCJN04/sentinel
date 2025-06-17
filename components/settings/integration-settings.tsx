"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Cloud, Database, FileText, Mail, Plus, RefreshCw } from "lucide-react"

export function IntegrationSettings() {
  // Mock integrations data
  const [integrations, setIntegrations] = useState([
    {
      id: "google-drive",
      name: "Google Drive",
      icon: <Cloud className="h-5 w-5 text-primary" />,
      status: "connected",
      lastSync: "Hace 2 horas",
      syncFrequency: "daily",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: <Cloud className="h-5 w-5 text-blue-500" />,
      status: "disconnected",
      lastSync: "Nunca",
      syncFrequency: "daily",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: <Cloud className="h-5 w-5 text-blue-600" />,
      status: "disconnected",
      lastSync: "Nunca",
      syncFrequency: "daily",
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: <Mail className="h-5 w-5 text-red-500" />,
      status: "connected",
      lastSync: "Hace 1 día",
      syncFrequency: "weekly",
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: <Mail className="h-5 w-5 text-blue-700" />,
      status: "disconnected",
      lastSync: "Nunca",
      syncFrequency: "daily",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      icon: <Calendar className="h-5 w-5 text-green-600" />,
      status: "connected",
      lastSync: "Hace 3 días",
      syncFrequency: "weekly",
    },
  ])

  const handleToggleConnection = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: integration.status === "connected" ? "disconnected" : "connected",
              lastSync: integration.status === "connected" ? "Nunca" : "Ahora",
            }
          : integration,
      ),
    )
  }

  const handleChangeSyncFrequency = (id: string, value: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              syncFrequency: value,
            }
          : integration,
      ),
    )
  }

  const handleSyncNow = (id: string) => {
    // In a real app, this would trigger a sync with the integration
    alert(`Sincronizando con ${integrations.find((i) => i.id === id)?.name}...`)

    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              lastSync: "Ahora",
            }
          : integration,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
          <CardDescription>
            Conecta DocuVault con otros servicios para importar y sincronizar documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-start justify-between p-4 border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-muted">{integration.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{integration.name}</h3>
                      <Badge
                        variant="outline"
                        className={
                          integration.status === "connected"
                            ? "bg-success/10 text-success border-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {integration.status === "connected" ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>
                    {integration.status === "connected" && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">
                          Última sincronización: {integration.lastSync}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Label htmlFor={`sync-${integration.id}`} className="text-xs">
                            Frecuencia:
                          </Label>
                          <Select
                            value={integration.syncFrequency}
                            onValueChange={(value) => handleChangeSyncFrequency(integration.id, value)}
                          >
                            <SelectTrigger id={`sync-${integration.id}`} className="h-7 text-xs w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Cada hora</SelectItem>
                              <SelectItem value="daily">Diaria</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSyncNow(integration.id)}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Sincronizar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Switch
                  checked={integration.status === "connected"}
                  onCheckedChange={() => handleToggleConnection(integration.id)}
                />
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Añadir nueva integración
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
