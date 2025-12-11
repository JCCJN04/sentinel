// app/dashboard/medicamentos/page.tsx
import { getUpcomingDoses } from "@/lib/actions/prescriptions.actions";
import { MedicamentosClient } from "./medicamentos-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "lucide-react";

export default async function MedicamentosPage() {
  const { data: doses, error } = await getUpcomingDoses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            Medicamentos
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tus dosis programadas y medicación activa
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-red-700 dark:text-red-400">Atrasadas</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
              {doses?.filter(d => {
                const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
                return diffMinutes < -60;
              }).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-amber-700 dark:text-amber-400">Urgentes (próxima hora)</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {doses?.filter(d => {
                const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
                return diffMinutes >= -60 && diffMinutes <= 60;
              }).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-emerald-700 dark:text-emerald-400">Próximas (2 horas)</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {doses?.filter(d => {
                const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
                return diffMinutes > 60 && diffMinutes <= 120;
              }).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-sky-200 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-sky-700 dark:text-sky-400">Programadas</CardDescription>
            <CardTitle className="text-3xl font-bold text-sky-600 dark:text-sky-400">
              {doses?.filter(d => {
                const diffMinutes = Math.round((new Date(d.scheduled_at).getTime() - Date.now()) / 60000);
                return diffMinutes > 120;
              }).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Medications List */}
      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40">
          <CardContent className="p-6">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <MedicamentosClient doses={doses || []} />
      )}
    </div>
  );
}
