// components/dashboard/upcoming-medication.tsx
import { getUpcomingDoses, type UpcomingDose } from "@/lib/actions/prescriptions.actions";
import { UpcomingMedicationClient } from "./upcoming-medication-client";

export async function UpcomingMedication() {
  const { data: doses, error } = await getUpcomingDoses();

  if (error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">{error}</p>;
  }

  return <UpcomingMedicationClient doses={doses} />;
}
