// app/dashboard/page.tsx
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { UpcomingMedication } from "@/components/dashboard/upcoming-medication";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";

export default function DashboardPage() {
  return (
    <>
      {/* Welcome Section with gradient background */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Mi Expediente Médico
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Resumen de tu información de salud</p>
        </div>
      </div>

      {/* Stats Section with Insights */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
        <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-sm">
          <DashboardStats />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <div className="lg:col-span-2">
          <RecentDocuments />
        </div>
        <div>
          <UpcomingMedication />
        </div>
      </div>
    </>
  );
}