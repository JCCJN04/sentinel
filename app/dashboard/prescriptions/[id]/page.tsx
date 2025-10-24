// app/dashboard/prescriptions/[id]/page.tsx
import { getPrescriptionById } from "@/lib/actions/prescriptions.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeletePrescriptionButton } from "./DeletePrescriptionButton";
import { RecipeDetailViewer } from "@/components/prescriptions/RecipeDetailViewer";

// Define the type for a single medication item within a prescription.
interface PrescriptionMedicine {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency_hours: number | null;
  duration: number | null;
  instructions: string | null;
}

export default async function PrescriptionDetailPage({ params }: { params: { id: string } }) {
    const { data: prescription, error } = await getPrescriptionById(params.id);

    if (error || !prescription) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p>{error || "No se ha encontrado la receta."}</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard/prescriptions">Volver a mis recetas</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <Button asChild variant="outline" size="sm">
                   <Link href="/dashboard/prescriptions">← Volver a la lista</Link>
                </Button>
                <DeletePrescriptionButton prescriptionId={prescription.id} />
            </div>

            <div className="p-6 border rounded-lg bg-card text-card-foreground">
                <RecipeDetailViewer prescription={prescription} />
            </div>
        </div>
    );
}