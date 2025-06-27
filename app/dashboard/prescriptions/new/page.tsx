// app/dashboard/prescriptions/new/page.tsx
"use client";

import { useState } from 'react';
import { createPrescription } from '@/lib/actions/prescriptions.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MedicationAutocomplete } from '@/components/prescriptions/MedicationAutocomplete';

// El tipo para el estado del medicamento
type Medicine = {
  medicine_name: string;
  dosage: string;
  frequency_hours: string; 
  duration: string;
  instructions: string;
};

export default function NewPrescriptionPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { medicine_name: '', dosage: '', frequency_hours: '', duration: '', instructions: '' },
  ]);

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { medicine_name: '', dosage: '', frequency_hours: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index: number) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Añadir Nueva Receta</h1>
      
      <form action={createPrescription} className="space-y-6 max-w-2xl">
        <input type="hidden" name="medicines" value={JSON.stringify(medicines)} />
        
        <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">Detalles de la Receta</h2>
            <div>
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Input id="diagnosis" name="diagnosis" placeholder="Ej: Faringitis aguda" required />
            </div>
            <div>
              <Label htmlFor="doctor_name">Nombre del Médico</Label>
              <Input id="doctor_name" name="doctor_name" placeholder="Ej: Dr. House" />
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
              <div className="w-full sm:w-1/2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              
              {/* CAMPO AÑADIDO PARA LA HORA DE INICIO */}
              <div className="w-full sm:w-1/2">
                <Label htmlFor="start_time">Hora de la Primera Dosis</Label>
                <Input id="start_time" name="start_time" type="time" required />
              </div>
            </div>
            <div className="flex space-x-4">
               <div className="w-1/2">
                <Label htmlFor="end_date">Fecha de Fin (Opcional)</Label>
                <Input id="end_date" name="end_date" type="date" />
              </div>
            </div>
            <div>
                <Label htmlFor="notes">Notas Generales</Label>
                <Textarea id="notes" name="notes" placeholder="Ej: Reposo por 3 días." />
            </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">Medicamentos</h2>
            {medicines.map((med, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3 relative">
                <h3 className="font-medium">Medicamento #{index + 1}</h3>
                {medicines.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => removeMedicine(index)}>X</Button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`med_name_${index}`}>Nombre del Medicamento</Label>
                        <MedicationAutocomplete 
                            value={med.medicine_name}
                            onValueChange={(newValue) => handleMedicineChange(index, 'medicine_name', newValue)}
                        />
                    </div>
                    <div>
                        <Label htmlFor={`med_dosage_${index}`}>Dosis</Label>
                        <Input id={`med_dosage_${index}`} value={med.dosage} onChange={e => handleMedicineChange(index, 'dosage', e.target.value)} placeholder="Ej: 500mg"/>
                    </div>
                    <div>
                        <Label htmlFor={`med_freq_${index}`}>Frecuencia (en horas)</Label>
                        <Input 
                            id={`med_freq_${index}`} 
                            type="number" 
                            value={med.frequency_hours} 
                            onChange={e => handleMedicineChange(index, 'frequency_hours', e.target.value)} 
                            placeholder="Ej: 8" 
                            min="1"
                        />
                    </div>
                     <div>
                        <Label htmlFor={`med_duration_${index}`}>Duración (días)</Label>
                        <Input 
                            id={`med_duration_${index}`} 
                            type="number" 
                            value={med.duration} 
                            onChange={e => handleMedicineChange(index, 'duration', e.target.value)} 
                            placeholder="Ej: 7"
                            min="1"
                        />
                    </div>
                </div>
                 <div>
                    <Label htmlFor={`med_instr_${index}`}>Instrucciones Adicionales</Label>
                    <Input id={`med_instr_${index}`} value={med.instructions} onChange={e => handleMedicineChange(index, 'instructions', e.target.value)} placeholder="Ej: Tomar con alimentos"/>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addMedicine}>
              + Añadir otro medicamento
            </Button>
        </div>

        <Button type="submit" size="lg">Guardar Receta Completa</Button>
      </form>
    </div>
  );
}