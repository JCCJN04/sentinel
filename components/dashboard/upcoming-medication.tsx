// components/dashboard/upcoming-medication.tsx
import { getUpcomingDoses, markDoseAsTaken, type UpcomingDose } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";

// No se necesita una interfaz local, se importa directamente de las actions
// interface Dose { ... }

export async function UpcomingMedication() {
  const { data: doses, error } = await getUpcomingDoses();

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div>
      {doses.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-4">No tienes medicamentos programados.</p>
      ) : (
        <ul className="space-y-3">
          {doses.map((dose: UpcomingDose) => {
            // Se accede directamente al objeto del medicamento
            const medicine = dose.prescription_medicines;

            return (
              <li key={dose.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {medicine ? `${medicine.medicine_name} (${medicine.dosage})` : 'Medicamento no especificado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hoy a las {new Date(dose.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <form action={markDoseAsTaken}>
                  <input type="hidden" name="doseId" value={dose.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Registrar Toma
                  </Button>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  );
}