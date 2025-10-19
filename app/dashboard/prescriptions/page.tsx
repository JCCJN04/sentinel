// app/dashboard/prescriptions/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Pill, 
  Calendar, 
  User, 
  ChevronRight, 
  Plus, 
  Camera,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

// Mock data - reemplazar con datos reales de la base de datos
const mockPrescriptions = [
  {
    id: "1",
    diagnosis: "Infección de garganta",
    doctor_name: "Dr. García López",
    start_date: "2024-10-15",
    status: "active",
    prescription_medicines: [
      { id: "1", medicine_name: "Amoxicilina", dosage: "500mg" },
      { id: "2", medicine_name: "Ibuprofeno", dosage: "200mg" }
    ]
  },
  {
    id: "2",
    diagnosis: "Hipertensión",
    doctor_name: "Dra. Martínez",
    start_date: "2024-09-10",
    status: "ongoing",
    prescription_medicines: [
      { id: "3", medicine_name: "Losartán", dosage: "50mg" }
    ]
  }
];

function PrescriptionCard({ prescription }: { prescription: any }) {
  const isActive = prescription.status === "active";
  const isOngoing = prescription.status === "ongoing";
  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(prescription.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/dashboard/prescriptions/${prescription.id}`}
      className="group relative p-6 rounded-xl border border-gray-200 dark:border-gray-800 
                 bg-white dark:bg-slate-900 hover:shadow-lg 
                 hover:border-emerald-300 dark:hover:border-emerald-700
                 transition-all duration-300 cursor-pointer
                 animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-cyan-50 
                      dark:from-emerald-950/10 dark:to-cyan-950/10 
                      rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />

      <div className="relative z-10 space-y-4">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate 
                          group-hover:text-emerald-600 dark:group-hover:text-emerald-400
                          transition-colors">
              {prescription.diagnosis}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{prescription.doctor_name}</span>
            </div>
          </div>
          
          {/* Status badge */}
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                           bg-emerald-100 dark:bg-emerald-900/30 
                           text-emerald-700 dark:text-emerald-300 text-xs font-semibold 
                           whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Activa
            </span>
          )}
          {isOngoing && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                           bg-blue-100 dark:bg-blue-900/30 
                           text-blue-700 dark:text-blue-300 text-xs font-semibold 
                           whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              En curso
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-700 group-hover:bg-emerald-300 
                       dark:group-hover:bg-emerald-700 transition-colors" />

        {/* Date info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>
            Desde: {new Date(prescription.start_date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })} ({daysAgo}d)
          </span>
        </div>

        {/* Medicines list */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              Medicamentos ({prescription.prescription_medicines.length})
            </h4>
          </div>
          <ul className="space-y-1 ml-6">
            {prescription.prescription_medicines.slice(0, 2).map((med: any) => (
              <li key={med.id} className="text-sm text-gray-700 dark:text-gray-300 
                                         flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                <span className="truncate">
                  <span className="font-medium">{med.medicine_name}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    ({med.dosage})
                  </span>
                </span>
              </li>
            ))}
            {prescription.prescription_medicines.length > 2 && (
              <li className="text-sm text-gray-500 dark:text-gray-400 italic ml-6">
                +{prescription.prescription_medicines.length - 2} más
              </li>
            )}
          </ul>
        </div>

        {/* CTA Arrow */}
        <div className="flex items-center justify-end pt-2">
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 
                                  dark:group-hover:text-emerald-400 transition-colors 
                                  group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-cyan-50 
                      dark:from-emerald-950/20 dark:to-cyan-950/20 rounded-2xl" />
      
      <div className="relative py-16 px-8 rounded-2xl border-2 border-dashed 
                      border-gray-300 dark:border-gray-700 text-center">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full 
                        bg-emerald-100 dark:bg-emerald-900/30 
                        flex items-center justify-center">
          <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No tienes recetas registradas
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Comienza a registrar tus recetas médicas para tener un control completo de tu salud.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 
                                    hover:opacity-90">
            <Link href="/dashboard/prescriptions/new">
              <Plus className="h-4 w-4" />
              Nueva receta manual
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/prescriptions/new">
              <Camera className="h-4 w-4" />
              Capturar foto
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const prescriptions = mockPrescriptions; // Reemplazar con datos reales

  const filteredPrescriptions = prescriptions.filter(p =>
    p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white 
                          bg-gradient-to-r from-emerald-600 to-cyan-600 
                          dark:from-emerald-400 dark:to-cyan-400
                          bg-clip-text text-transparent">
              Mis Recetas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona y controla todas tus recetas médicas en un solo lugar
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 
                                      hover:opacity-90 h-10">
              <Link href="/dashboard/prescriptions/new">
                <Plus className="h-4 w-4" />
                Nueva receta
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por diagnóstico o médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700
                      bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 
                          flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {prescriptions.filter(p => p.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 
                          flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">En curso</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {prescriptions.filter(p => p.status === "ongoing").length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 
                          flex items-center justify-center">
              <Pill className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Medicamentos</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {prescriptions.reduce((sum, p) => sum + p.prescription_medicines.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions Grid */}
      {filteredPrescriptions.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron recetas que coincidan con "{searchQuery}"
          </p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))}
        </div>
      )}
    </div>
  );
}