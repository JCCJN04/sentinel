import { getUnifiedAlertsForUser } from '@/lib/actions/alerts.actions'
import { AlertListClient } from '@/components/alertas/alert-list-client'

export default async function AlertasPage() {
  // Obtenemos los datos en el servidor
  const { data: alerts } = await getUnifiedAlertsForUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Alertas</h1>
        <p className="text-muted-foreground">
          Aquí encontrarás todas las notificaciones importantes sobre tus documentos, familia y cuenta.
        </p>
      </div>
      
      {/* Pasamos los datos al componente cliente para la interactividad */}
      <AlertListClient alerts={alerts} />
    </div>
  )
}