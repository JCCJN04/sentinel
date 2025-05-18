import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentDocuments } from "@/components/dashboard/recent-documents"
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a Sentinel, tu centro de gestión documental personal.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Documentos recientes</CardTitle>
            <CardDescription>Los últimos documentos que has añadido o modificado.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentDocuments />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>Documentos que requieren tu atención pronto.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingReminders />
          </CardContent>
        </Card>
      </div>

      <QuickActions />
    </div>
  )
}
