// app/dashboard/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
// Importa el componente de recordatorios de documentos existente
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
// ¡Importa el nuevo componente de medicamentos!
import { UpcomingMedication } from "@/components/dashboard/upcoming-medication";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a Sentinel, tu centro de gestión personal.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Documentos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDocuments />
          </CardContent>
        </Card>

        {/* Columna para ambos tipos de recordatorios */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Tomas de Medicamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingMedication />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vencimiento de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tu componente de recordatorios de documentos existente */}
              <UpcomingReminders />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}