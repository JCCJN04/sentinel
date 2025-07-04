import { getVaccinesForUser, getVaccineCatalog } from "@/lib/actions/vaccines.actions";
import { VaccineClientPage } from "@/components/vacunas/vaccine-client-page";

export default async function VacunasPage() {
  // Obtenemos los datos en el servidor para una carga inicial rápida
  const [{ data: initialVaccines }, vaccineCatalog] = await Promise.all([
    getVaccinesForUser(),
    getVaccineCatalog()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Esquema de Vacunación</h1>
        <p className="text-muted-foreground">
          Mantén un registro claro y ordenado de tu historial de vacunación.
        </p>
      </div>
      <VaccineClientPage 
        initialVaccines={initialVaccines || []} 
        vaccineCatalog={vaccineCatalog}
      />
    </div>
  );
}