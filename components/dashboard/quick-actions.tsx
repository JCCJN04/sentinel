// components/dashboard/quick-actions.tsx
"use client"; // Necesario para componentes interactivos y Link de Next.js

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, PlusCircle, FileText, Pill, HeartPulse, Share2 } from "lucide-react"; // Asegúrate de que los iconos estén disponibles

export function QuickActions() {
  const actions = [
    { href: "/dashboard/subir", icon: Upload, label: "Subir Documento", color: "blue" },
    { href: "/dashboard/documentos", icon: FileText, label: "Ver Documentos", color: "purple" },
    { href: "/dashboard/prescriptions", icon: HeartPulse, label: "Recetas", color: "rose" },
    { href: "/dashboard/medicamentos", icon: Pill, label: "Medicamentos", color: "emerald" },
    { href: "/dashboard/compartidos", icon: Share2, label: "Compartir", color: "sky" },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200/50 dark:border-blue-800/50" },
    sky: { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-600 dark:text-sky-400", border: "border-sky-200/50 dark:border-sky-800/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/50 dark:border-emerald-800/50" },
    rose: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200/50 dark:border-rose-800/50" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200/50 dark:border-purple-800/50" },
  };

  return (
    <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Acciones Rápidas
        </CardTitle>
        <CardDescription>Acceso directo a funciones principales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const colors = colorMap[action.color as keyof typeof colorMap];
            return (
              <Button 
                key={idx}
                asChild 
                variant="outline" 
                className={`flex flex-col h-auto py-4 px-3 rounded-lg border-2 transition-all duration-300 hover:shadow-md hover:scale-105 animate-in fade-in slide-in-from-bottom-2 ${colors.border} ${colors.bg}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Link href={action.href} className="flex flex-col items-center">
                  <Icon className={`h-6 w-6 mb-2 ${colors.text}`} />
                  <span className="text-xs font-medium text-center line-clamp-2">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}