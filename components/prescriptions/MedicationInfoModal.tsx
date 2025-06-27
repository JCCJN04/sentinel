// components/prescriptions/MedicationInfoModal.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MedicationInfoModalProps {
  medicationName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MedicationDetails {
    generic_name: string;
    brand_name: string;
    description: string;
    indications_and_usage: string;
    warnings: string;
}

export function MedicationInfoModal({ medicationName, isOpen, onClose }: MedicationInfoModalProps) {
  const [details, setDetails] = useState<MedicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && medicationName) {
      setIsLoading(true);
      setError(null);
      setDetails(null);

      fetch(`/api/medications/details?name=${encodeURIComponent(medicationName)}`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => Promise.reject(err));
          }
          return res.json();
        })
        .then(data => {
          setDetails(data);
        })
        .catch(err => {
          setError(err.error || 'No se pudo cargar la información.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, medicationName]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">{error}</p>;
    }

    if (details) {
      return (
        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
          <p><strong>Nombre Genérico:</strong> {details.generic_name}</p>
          <p><strong>Nombre de Marca:</strong> {details.brand_name}</p>
          
          <h4 className="font-semibold mt-4">Descripción</h4>
          <p className="text-muted-foreground">{details.description}</p>
          
          <h4 className="font-semibold mt-4">Indicaciones y Uso</h4>
          <p className="text-muted-foreground">{details.indications_and_usage}</p>
          
          <h4 className="font-semibold mt-4">Advertencias</h4>
          <p className="text-muted-foreground">{details.warnings}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{medicationName}</DialogTitle>
          <DialogDescription>
            Información obtenida de openFDA. Consulta siempre a tu médico.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
