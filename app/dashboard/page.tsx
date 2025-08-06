// app/dashboard/page.tsx
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { UpcomingMedication } from "@/components/dashboard/upcoming-medication";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
import { MobileNav } from "@/components/dashboard/mobile-nav"; // Asegúrate de que MobileNav esté en el layout o en un componente global

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* MobileNav podría ir en el layout principal o aquí si es específico del dashboard */}
      {/* <MobileNav /> */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {/* Dashboard Stats - Optimizado para móviles */}
          <DashboardStats />

          {/* Quick Actions - Optimizado para móviles */}
          <QuickActions />

          {/* Secciones de Documentos y Recordatorios - Apiladas en móvil */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <RecentDocuments />
            <UpcomingMedication />
          </div>

          {/* Puedes añadir más secciones aquí si las tienes */}
        </main>
      </div>
    </div>
  );
}