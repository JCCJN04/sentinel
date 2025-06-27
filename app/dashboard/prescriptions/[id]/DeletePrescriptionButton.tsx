// app/dashboard/prescriptions/[id]/DeletePrescriptionButton.tsx
"use client";

import { deletePrescription } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";

// Este es un componente de cliente que solo se encarga del botón
export function DeletePrescriptionButton({ prescriptionId }: { prescriptionId: string }) {
  
  // Usamos el `action` en el formulario para invocar la Server Action
  return (
    <form action={deletePrescription}>
      <input type="hidden" name="id" value={prescriptionId} />
      <Button 
        type="submit"
        variant="destructive"
        size="sm"
        // El onClick ahora es seguro porque estamos en un componente de cliente
        onClick={(e) => {
          if (!window.confirm('¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.')) {
            e.preventDefault(); // Cancela el envío del formulario si el usuario dice "No"
          }
        }}
      >
        Eliminar Receta
      </Button>
    </form>
  );
}