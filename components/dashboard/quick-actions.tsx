// components/dashboard/quick-actions.tsx
"use client"; // Necesario para componentes interactivos y Link de Next.js

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, PlusCircle, FileText, Pill, Bell } from "lucide-react"; // Asegúrate de que los iconos estén disponibles

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Accede rápidamente a las funciones más usadas.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Botón para Subir Documento */}
        <Button asChild variant="outline" className="flex flex-col h-auto py-4">
          <Link href="/dashboard/subir">
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-xs">Subir Documento</span>
          </Link>
        </Button>
        {/* Botón para Nueva Prescripción */}
        <Button asChild variant="outline" className="flex flex-col h-auto py-4">
          <Link href="/dashboard/prescriptions/new">
            <Pill className="h-6 w-6 mb-1" />
            <span className="text-xs">Nueva Prescripción</span>
          </Link>
        </Button>
        {/* Botón para Ver Medicamentos */}
        <Button asChild variant="outline" className="flex flex-col h-auto py-4">
          <Link href="/dashboard/medicamentos">
            <Pill className="h-6 w-6 mb-1" /> {/* Puedes cambiar a Syringe si lo tienes en components/icons.tsx */}
            <span className="text-xs">Ver Medicamentos</span>
          </Link>
        </Button>
        {/* Botón para Ver Alertas */}
        <Button asChild variant="outline" className="flex flex-col h-auto py-4">
          <Link href="/dashboard/alertas">
            <Bell className="h-6 w-6 mb-1" />
            <span className="text-xs">Ver Alertas</span>
          </Link>
        </Button>
        {/* Botón para Todos los Documentos */}
        <Button asChild variant="outline" className="flex flex-col h-auto py-4">
          <Link href="/dashboard/documentos">
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-xs">Todos los Docs</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
