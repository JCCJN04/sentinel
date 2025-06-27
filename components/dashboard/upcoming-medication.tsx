// components/dashboard/upcoming-medication.tsx
import { getUpcomingDoses, markDoseAsTaken } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react"; // Un ícono apropiado

// Define a type for the Dose object based on the getUpcomingDoses query
interface Dose {
  id: string;
  scheduled_at: string;
  prescription_medicines: {
    medicine_name: string;
    dosage: string;
  }[]; // It's an array of medication details
}

export async function UpcomingMedication() {
  const { data: doses, error } = await getUpcomingDoses();

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div>
      {doses.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-4">No tienes medicamentos programados.</p>
      ) : (
        <ul className="space-y-3">
          {doses.map((dose: Dose) => ( // Applied the Dose type here
            <li key={dose.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <div className="flex items-center gap-3">
                 <Pill className="h-5 w-5 text-primary" />
                 <div>
                    {/* Access the first element of the array */}
                    <p className="font-medium">{dose.prescription_medicines[0]?.medicine_name}</p>
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
          ))}
        </ul>
      )}
    </div>
  );
}