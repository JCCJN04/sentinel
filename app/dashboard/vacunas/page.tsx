import { getVaccinesForUser, getVaccineCatalog } from "@/lib/actions/vaccines.actions";
import { VaccineClientPage } from "@/components/vacunas/vaccine-client-page";

export default async function VacunasPage() {
  // Obtenemos los datos en el servidor para una carga inicial rápida
  const [{ data: initialVaccines }, vaccineCatalog] = await Promise.all([
    getVaccinesForUser(),
    getVaccineCatalog()
  ]);

  return (
    <div className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        <div className="space-y-1 sm:space-y-2 md:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Esquema de vacunación
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Mantén un registro claro y ordenado de tu historial.
          </p>
        </div>
        <VaccineClientPage initialVaccines={initialVaccines || []} vaccineCatalog={vaccineCatalog} />
      </div>
    </div>
  );
}