import { getUnifiedAlertsForUser } from '@/lib/actions/alerts.actions'
import { AlertListClient } from '@/components/alertas/alert-list-client'

export default async function AlertasPage() {
  // Obtenemos los datos en el servidor
  const { data: alerts } = await getUnifiedAlertsForUser();

  return (
    <div className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        <div className="space-y-1 sm:space-y-2 md:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Centro de Alertas
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Todas las notificaciones sobre tus documentos, familia y cuenta.
          </p>
        </div>
        
        {/* Pasamos los datos al componente cliente para la interactividad */}
        <AlertListClient alerts={alerts} />
      </div>
    </div>
  )
}