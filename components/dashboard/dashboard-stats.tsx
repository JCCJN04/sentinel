"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, HardDrive, AlertTriangle, Bell } from "lucide-react"
import { getUserStats, formatFileSize } from "@/lib/document-service"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentDocuments: 0,
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB por defecto
    expiringDocuments: 0,
    activeAlerts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        const userStats = await getUserStats()
        setStats(userStats)
        setError(null)
      } catch (err) {
        console.error("Error al cargar estadísticas:", err)
        setError("No se pudieron cargar las estadísticas")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  // Calcular el porcentaje de almacenamiento utilizado
  const storagePercentage = Math.min(100, (stats.storageUsed / stats.storageLimit) * 100)

  // Formatear el espacio utilizado
  const formattedStorageUsed = formatFileSize(stats.storageUsed)
  const formattedStorageLimit = formatFileSize(stats.storageLimit)

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        {error}. Por favor, recarga la página para intentar nuevamente.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de documentos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">+{stats.recentDocuments} en los últimos 7 días</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Espacio utilizado</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedStorageUsed}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${storagePercentage}%` }}></div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(storagePercentage)}% de {formattedStorageLimit} disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringDocuments}</div>
          <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas activas</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeAlerts > 0
              ? `${Math.min(stats.activeAlerts, 2)} requieren atención inmediata`
              : "No hay alertas pendientes"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
