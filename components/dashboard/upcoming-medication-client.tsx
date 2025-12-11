// components/dashboard/upcoming-medication-client.tsx
"use client";

import { useState } from "react";
import { markDoseAsTaken, type UpcomingDose } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pill, Clock, AlertTriangle, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRelative(target: Date, now: Date) {
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (absMinutes < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

type DoseStatus = "missed" | "due" | "soon" | "upcoming";

function getDoseStatus(target: Date, now: Date): DoseStatus {
  const diffMinutes = Math.round((target.getTime() - now.getTime()) / 60000);

  if (diffMinutes < -60) {
    return "missed"; // más de una hora atrasado
  }
  if (diffMinutes <= 60) {
    return "due"; // dentro de la próxima hora (incluye pasado reciente)
  }
  if (diffMinutes <= 120) {
    return "soon"; // dentro de las próximas 2 horas
  }
  return "upcoming"; // más de 2 horas en el futuro
}

// Calcula el progreso de tiempo hasta la dosis (0-100)
function calculateTimeProgress(scheduledAt: Date, now: Date): { progress: number; timeLeft: string } {
  const diffMs = scheduledAt.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  
  // Si ya pasó la hora
  if (diffMinutes < 0) {
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes < 60) {
      return { progress: 100, timeLeft: `Hace ${absMinutes} min` };
    }
    const hours = Math.floor(absMinutes / 60);
    return { progress: 100, timeLeft: `Hace ${hours}h ${absMinutes % 60}min` };
  }
  
  // Calcular progreso basado en 24 horas
  const totalMinutesInDay = 24 * 60;
  const progress = Math.max(0, Math.min(100, ((totalMinutesInDay - diffMinutes) / totalMinutesInDay) * 100));
  
  // Formatear tiempo restante
  let timeLeft = "";
  if (diffMinutes < 60) {
    timeLeft = `En ${diffMinutes} min`;
  } else if (diffMinutes < 1440) { // menos de 24 horas
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    timeLeft = mins > 0 ? `En ${hours}h ${mins}min` : `En ${hours}h`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    timeLeft = hours > 0 ? `En ${days}d ${hours}h` : `En ${days}d`;
  }
  
  return { progress, timeLeft };
}

const statusCopy: Record<DoseStatus, { label: string; description: string }> = {
  missed: {
    label: "Atrasada",
    description: "Registra la toma cuanto antes",
  },
  due: {
    label: "En curso",
    description: "Es hora de tomarla",
  },
  soon: {
    label: "Próxima",
    description: "Prepárate para la dosis",
  },
  upcoming: {
    label: "Programada",
    description: "Aún falta tiempo",
  },
};

const statusBadgeClasses: Record<DoseStatus, string> = {
  missed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
  due: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  soon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  upcoming: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
};

function DoseCard({ dose, initialNow }: { dose: UpcomingDose; initialNow: Date }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const medicine = dose.prescription_medicines;
  const scheduledAt = new Date(dose.scheduled_at);
  const status = getDoseStatus(scheduledAt, initialNow);
  const relative = formatRelative(scheduledAt, initialNow);
  const { progress, timeLeft } = calculateTimeProgress(scheduledAt, initialNow);
  const normalizedInstructions = (medicine?.instructions ?? "").trim();
  const hasSpecificInstructions = normalizedInstructions && normalizedInstructions.toLowerCase() !== "no especificado";
  const frequencyHours = medicine?.frequency_hours;

  const handleMarkAsTaken = async () => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('doseId', dose.id);
      
      const result = await markDoseAsTaken(formData);
      
      if (result?.success === false) {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar la toma",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Toma registrada",
          description: `${medicine?.medicine_name} ha sido registrada correctamente`,
        });
      }
    } catch (error) {
      console.error('Error al marcar toma:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la toma",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-background/80 p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900/70",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-r-full before:content-['']",
        status === "missed" && "border-red-200 dark:border-red-900/40 before:bg-red-500",
        status === "due" && "border-amber-200 dark:border-amber-900/40 before:bg-amber-500",
        status === "soon" && "border-emerald-200 dark:border-emerald-900/40 before:bg-emerald-500",
        status === "upcoming" && "border-sky-200 dark:border-sky-900/40 before:bg-sky-500",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <div className={cn("rounded-full p-2", {
            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-200": status === "missed",
            "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200": status === "due",
            "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200": status === "soon",
            "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-200": status === "upcoming",
          })}>
            <Pill className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {medicine ? medicine.medicine_name : "Medicamento no especificado"}
              </h3>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                statusBadgeClasses[status],
              )}>
                {status === "missed" ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {statusCopy[status].label}
              </span>
            </div>

            {medicine?.dosage && (
              <p className="text-sm text-muted-foreground">Dosis: {medicine.dosage}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(scheduledAt)}
              </span>
              <span className="text-foreground/70">{relative}</span>
              {frequencyHours ? (
                <span className="rounded-full bg-muted px-2 py-1 font-medium">
                  Cada {frequencyHours} h
                </span>
              ) : null}
            </div>

            {/* Barra de progreso de tiempo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Tiempo restante</span>
                <span className={cn(
                  "font-semibold",
                  status === "missed" && "text-red-600 dark:text-red-400",
                  status === "due" && "text-amber-600 dark:text-amber-400",
                  status === "soon" && "text-emerald-600 dark:text-emerald-400",
                  status === "upcoming" && "text-sky-600 dark:text-sky-400"
                )}>
                  {timeLeft}
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                indicatorClassName={cn(
                  status === "missed" && "bg-red-500",
                  status === "due" && "bg-amber-500",
                  status === "soon" && "bg-emerald-500",
                  status === "upcoming" && "bg-sky-500"
                )}
              />
            </div>

            {hasSpecificInstructions && (
              <p className="text-sm text-foreground/80">
                <span className="font-medium">Indicaciones:</span> {normalizedInstructions}
              </p>
            )}

            <p className="text-xs text-muted-foreground">{statusCopy[status].description}</p>
          </div>
        </div>

        <Button
          onClick={handleMarkAsTaken}
          disabled={isSubmitting}
          size="sm"
          variant={status === "missed" ? "destructive" : status === "due" ? "default" : "outline"}
          className={cn(
            status === "missed" && "bg-red-600 hover:bg-red-700",
            status === "due" && "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar toma"
          )}
        </Button>
      </div>
    </article>
  );
}

export function UpcomingMedicationClient({ doses }: { doses: UpcomingDose[] }) {
  const now = new Date();

  if (doses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Pill className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold text-foreground">Sin tomas pendientes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Programa una receta o agrega recordatorios para verlos aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {doses.map((dose) => (
        <DoseCard key={dose.id} dose={dose} initialNow={now} />
      ))}
    </div>
  );
}
