import { getMedicalHistory, getConditionsCatalog } from "@/lib/actions/history.actions";
import { MedicalHistoryClient } from "@/components/antecedentes/medical-history-client";

export default async function AntecedentesPage() {
  // Obtenemos los datos en el servidor para una carga inicial rápida
  const historyData = await getMedicalHistory();
  const conditionsCatalog = await getConditionsCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Antecedentes Médicos</h1>
        <p className="text-muted-foreground">
          Registra y gestiona tu historial médico personal y familiar.
        </p>
      </div>
      <MedicalHistoryClient
        initialPersonalHistory={historyData.personal}
        initialFamilyHistory={historyData.family}
        conditionsCatalog={conditionsCatalog}
      />
    </div>
  );
}