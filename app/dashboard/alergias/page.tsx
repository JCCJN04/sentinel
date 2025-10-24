// app/dashboard/alergias/page.tsx
"use client"

import { AlergiasManager } from "@/components/alergias/alergias-manager";
import { AlertCircle, Shield, Heart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AlergiasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
              Gestión de Alergias
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl ml-11">
            Mantén un registro completo y detallado de tus alergias. Esta información es crucial para tu seguridad médica.
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 ml-11">
          <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            Las alergias registradas pueden ser críticas para tu salud. Asegúrate de que toda la información sea exacta y completa.
          </AlertDescription>
        </Alert>

        {/* Manager Component */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AlergiasManager />
        </div>
      </div>
    </div>
  );
}