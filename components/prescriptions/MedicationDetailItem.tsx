// components/prescriptions/MedicationDetailItem.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MedicationInfoModal } from "./MedicationInfoModal";
import { Info } from "lucide-react";

// Definimos el tipo para las props que recibirá el componente
type Medication = {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency_hours: number | null;
  duration: number | null;
  instructions: string | null;
};

interface MedicationDetailItemProps {
  med: Medication;
}

export function MedicationDetailItem({ med }: MedicationDetailItemProps) {
  // Estado para controlar la visibilidad del modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="p-4 border rounded-md">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">{med.medicine_name}</p>
          {/* Botón para abrir el modal de información */}
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsModalOpen(true)}
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2">
          <p><strong className="block text-muted-foreground">Dosis:</strong> {med.dosage || '-'}</p>
          <p><strong className="block text-muted-foreground">Frecuencia:</strong> {med.frequency_hours ? `Cada ${med.frequency_hours} horas` : '-'}</p>
          <p><strong className="block text-muted-foreground">Duración:</strong> {med.duration ? `${med.duration} días` : '-'}</p>
        </div>
        {med.instructions && (
          <p className="mt-2 text-sm"><strong className="text-muted-foreground">Instrucciones:</strong> {med.instructions}</p>
        )}
      </div>

      {/* El componente Modal, que se mostrará cuando isModalOpen sea true */}
      <MedicationInfoModal 
          medicationName={med.medicine_name}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}