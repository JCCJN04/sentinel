import { getMedicalHistory, getConditionsCatalog } from "@/lib/actions/history.actions";
import { MedicalHistoryClient } from "@/components/antecedentes/medical-history-client";

export default async function AntecedentesPage() {
  // Obtenemos los datos en el servidor para una carga inicial rápida
  const historyData = await getMedicalHistory();
  const conditionsCatalog = await getConditionsCatalog();

  return (
    <div className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        <div className="space-y-1 sm:space-y-2 md:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Antecedentes Médicos
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Registra y gestiona tu historial médico personal y familiar.
          </p>
        </div>
        <MedicalHistoryClient
          initialPersonalHistory={historyData.personal}
          initialFamilyHistory={historyData.family}
          conditionsCatalog={conditionsCatalog}
        />
      </div>
    </div>
  );
}