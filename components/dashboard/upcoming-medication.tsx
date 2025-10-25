// components/dashboard/upcoming-medication.tsx
import { getUpcomingDoses, markDoseAsTaken, type UpcomingDose } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";
import { Pill, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  if (diffMinutes < 0) {
    return "due"; // en el rango cercano y ya debería tomarse
  }
  if (diffMinutes <= 60) {
    return "soon"; // dentro de la siguiente hora
  }
  return "upcoming";
}

const statusCopy: Record<DoseStatus, { label: string; description: string }> = {
  missed: {
    label: "Atrasada",
    description: "Registra la toma cuanto antes",
  },
  due: {
    label: "En curso",
    description: "Deberías tomarla ya",
  },
  soon: {
    label: "Próxima",
    description: "Prepárate para la dosis",
  },
  upcoming: {
    label: "Programada",
    description: "Aún falta un poco",
  },
};

const statusBadgeClasses: Record<DoseStatus, string> = {
  missed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
  due: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  soon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  upcoming: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
};

export async function UpcomingMedication() {
  const { data: doses, error } = await getUpcomingDoses();

  if (error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">{error}</p>;
  }

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

  const now = new Date();

  return (
    <div className="space-y-3">
      {doses.map((dose: UpcomingDose) => {
        const medicine = dose.prescription_medicines;
        const scheduledAt = new Date(dose.scheduled_at);
        const status = getDoseStatus(scheduledAt, now);
        const relative = formatRelative(scheduledAt, now);
        const normalizedInstructions = (medicine?.instructions ?? "").trim();
        const hasSpecificInstructions = normalizedInstructions && normalizedInstructions.toLowerCase() !== "no especificado";
        const frequencyHours = medicine?.frequency_hours;

        return (
          <article
            key={dose.id}
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

                  {hasSpecificInstructions && (
                    <p className="text-sm text-foreground/80">
                      <span className="font-medium">Indicaciones:</span> {normalizedInstructions}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">{statusCopy[status].description}</p>
                </div>
              </div>

              <form action={markDoseAsTaken} className="flex-shrink-0">
                <input type="hidden" name="doseId" value={dose.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant={status === "missed" ? "destructive" : status === "due" ? "default" : "outline"}
                  className={cn(
                    status === "missed" && "bg-red-600 hover:bg-red-700",
                    status === "due" && "bg-emerald-600 hover:bg-emerald-700",
                  )}
                >
                  Registrar toma
                </Button>
              </form>
            </div>
          </article>
        );
      })}
    </div>
  );
}