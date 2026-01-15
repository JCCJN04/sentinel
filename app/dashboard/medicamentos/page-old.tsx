// app/dashboard/medicamentos/page.tsx
import { getUpcomingDoses, getActiveMedications, getDoseHistory } from "@/lib/actions/prescriptions.actions";
import { MedicamentosClient } from "./medicamentos-client";
import { WhatsAppAlertsStatus } from "@/components/medications/whatsapp-alerts-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Activity, Clock, TrendingUp, Bell } from "lucide-react";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function MedicamentosPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: doses, error } = await getUpcomingDoses();
  const { data: medications, error: medError } = await getActiveMedications();
  const { data: history, error: historyError } = await getDoseHistory();

  // Calcular métricas
  const totalMedications = medications?.length || 0;
  const totalDoses = doses?.length || 0;
  
  const dosesStats = {
    missed: doses?.filter(d => {
      const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
      return diffMinutes < -60;
    }).length || 0,
    urgent: doses?.filter(d => {
      const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
      return diffMinutes >= -60 && diffMinutes <= 60;
    }).length || 0,
    soon: doses?.filter(d => {
      const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
      return diffMinutes > 60 && diffMinutes <= 120;
    }).length || 0,
    scheduled: doses?.filter(d => {
      const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
      return diffMinutes > 120;
    }).length || 0,
  };

  // Calcular adherencia (dosis no atrasadas vs total)
  const adherenceRate = totalDoses > 0 
    ? Math.round(((totalDoses - dosesStats.missed) / totalDoses) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header con gradiente mejorado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-4 shadow-lg">
              <Pill className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Gestión de Medicamentos
              </h1>
              <p className="mt-1 text-indigo-100">
                Control inteligente de tu medicación con notificaciones por WhatsApp
              </p>
            </div>
          </div>
          
          {/* Indicadores rápidos */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span className="font-semibold">{totalMedications} Medicamentos activos</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">{totalDoses} Dosis programadas</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-semibold">Alertas WhatsApp activas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards mejoradas con animaciones */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-purple-950/40 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-indigo-700 dark:text-indigo-400 font-medium">
                Adherencia
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {adherenceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all"
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:border-red-900/40 dark:from-red-950/40 dark:to-pink-950/40 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardDescription className="text-red-700 dark:text-red-400 font-medium">Atrasadas</CardDescription>
            <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400">
              {dosesStats.missed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600 dark:text-red-400">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/40 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardDescription className="text-amber-700 dark:text-amber-400 font-medium">Urgentes</CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {dosesStats.urgent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-amber-600 dark:text-amber-400">Próxima hora</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/40 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium">Próximas</CardDescription>
            <CardTitle className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {dosesStats.soon}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">En 2 horas</p>
          </CardContent>
        </Card>

        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 dark:border-sky-900/40 dark:from-sky-950/40 dark:to-blue-950/40 hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardDescription className="text-sky-700 dark:text-sky-400 font-medium">Programadas</CardDescription>
            <CardTitle className="text-4xl font-bold text-sky-600 dark:text-sky-400">
              {dosesStats.scheduled}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-sky-600 dark:text-sky-400">Más adelante</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Alerts Configuration */}
      {user && <WhatsAppAlertsStatus userId={user.id} />}

      {/* Medications List */}
      {error || medError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40">
          <CardContent className="p-6">
            <p className="text-sm text-red-700 dark:text-red-400">{error || medError}</p>
          </CardContent>
        </Card>
      ) : (
        <MedicamentosClient 
          doses={doses || []} 
          medications={medications || []}
          history={history || []}
        />
      )}
    </div>
  );
}
