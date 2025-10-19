// app/dashboard/prescriptions/new/page.tsx
"use client";

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { createPrescription, type PrescriptionFormState } from '@/lib/actions/prescriptions.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MedicationAutocomplete } from '@/components/prescriptions/MedicationAutocomplete';
import { RecipePhotoCapper } from '@/components/prescriptions/RecipePhotoCapper';
import { Loader2, Trash2, Plus, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

type Medicine = {
  medicine_name: string;
  dosage: string;
  frequency_hours: string; 
  duration: string;
  instructions: string;
};

function SubmitButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button 
      type="submit" 
      size="lg" 
      disabled={pending}
      className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {pending ? 'Guardando receta...' : 'Guardar Receta Completa'}
    </Button>
  );
}

export default function NewPrescriptionPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { medicine_name: '', dosage: '', frequency_hours: '', duration: '', instructions: '' },
  ]);

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    diagnosis: '',
    doctor_name: '',
    start_date: '',
    start_time: '',
    end_date: '',
    notes: ''
  });

  const initialState: PrescriptionFormState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createPrescription, initialState);

  const handlePhotoExtraction = (data: any) => {
    setExtractedData(data);
    // Pre-fill form with extracted data
    if (data.diagnosis) setFormData(prev => ({ ...prev, diagnosis: data.diagnosis }));
    if (data.doctor_name) setFormData(prev => ({ ...prev, doctor_name: data.doctor_name }));
    if (data.medicines) setMedicines(data.medicines);
  };

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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white 
                      bg-gradient-to-r from-emerald-600 to-cyan-600 
                      dark:from-emerald-400 dark:to-cyan-400
                      bg-clip-text text-transparent">
          Agregar Nueva Receta
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Registra los detalles de tu receta médica de forma rápida y fácil
        </p>
      </div>

      {/* Photo Capture Alert */}
      {!photoData && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900 dark:text-blue-200">💡 Tip</p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
              Puedes capturar una foto de tu receta para extraer automáticamente los datos.
              Utiliza el botón "Capturar Receta" para comenzar.
            </p>
          </div>
        </div>
      )}

      {/* Photo and Extracted Data Display */}
      {photoData && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              Receta capturada correctamente
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <img 
                src={photoData} 
                alt="Receta capturada" 
                className="w-full rounded-lg border border-emerald-300 dark:border-emerald-700"
              />
            </div>
            
            {extractedData && (
              <div className="lg:col-span-2 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                    DIAGNÓSTICO DETECTADO
                  </p>
                  <p className="text-emerald-900 dark:text-emerald-100 font-medium">
                    {extractedData.diagnosis}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                    MÉDICO
                  </p>
                  <p className="text-emerald-900 dark:text-emerald-100">
                    {extractedData.doctor_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                    MEDICAMENTOS DETECTADOS
                  </p>
                  <ul className="space-y-1">
                    {extractedData.medicines?.slice(0, 3).map((med: any, idx: number) => (
                      <li key={idx} className="text-emerald-900 dark:text-emerald-100">
                        • {med.medicine_name} ({med.dosage})
                      </li>
                    ))}
                    {extractedData.medicines?.length > 3 && (
                      <li className="text-emerald-700 dark:text-emerald-400 italic text-xs">
                        +{extractedData.medicines.length - 3} medicamentos más
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form action={dispatch} className="space-y-6">
        <input type="hidden" name="medicines" value={JSON.stringify(medicines)} />
        {photoData && <input type="hidden" name="photo_data" value={photoData} />}

        {/* Receta Details Section */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalles de la Receta
            </h2>
            <RecipePhotoCapper 
              onPhotoCapture={setPhotoData}
              onDataExtracted={handlePhotoExtraction}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis" className="font-semibold">
                Diagnóstico *
              </Label>
              <Input 
                id="diagnosis" 
                name="diagnosis" 
                placeholder="Ej: Faringitis aguda"
                value={formData.diagnosis}
                onChange={(e) => handleFormChange('diagnosis', e.target.value)}
                className="focus:ring-2 focus:ring-emerald-500"
              />
              {state.errors?.diagnosis &&
                state.errors.diagnosis.map((error: string) => (
                  <p className="text-sm font-medium text-red-500 mt-1" key={error}>
                    {error}
                  </p>
              ))}
            </div>

            {/* Doctor Name */}
            <div className="space-y-2">
              <Label htmlFor="doctor_name" className="font-semibold">
                Nombre del Médico
              </Label>
              <Input 
                id="doctor_name" 
                name="doctor_name" 
                placeholder="Ej: Dr. García López"
                value={formData.doctor_name}
                onChange={(e) => handleFormChange('doctor_name', e.target.value)}
                className="focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date" className="font-semibold">
                Fecha de Inicio *
              </Label>
              <Input 
                id="start_date" 
                name="start_date" 
                type="date"
                value={formData.start_date}
                onChange={(e) => handleFormChange('start_date', e.target.value)}
                className="focus:ring-2 focus:ring-emerald-500"
              />
              {state.errors?.start_date &&
                state.errors.start_date.map((error: string) => (
                  <p className="text-sm font-medium text-red-500 mt-1" key={error}>
                    {error}
                  </p>
              ))}
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start_time" className="font-semibold">
                Hora de la Primera Dosis
              </Label>
              <Input 
                id="start_time" 
                name="start_time" 
                type="time"
                value={formData.start_time}
                onChange={(e) => handleFormChange('start_time', e.target.value)}
                className="focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date" className="font-semibold">
                Fecha de Fin (Opcional)
              </Label>
              <Input 
                id="end_date" 
                name="end_date" 
                type="date"
                value={formData.end_date}
                onChange={(e) => handleFormChange('end_date', e.target.value)}
                className="focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-semibold">
              Notas Generales
            </Label>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="Ej: Reposo por 3 días, evitar alimentos ácidos..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              className="focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Medicines Section */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 space-y-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Medicamentos ({medicines.length})
          </h2>

          <div className="space-y-4">
            {medicines.map((med, index) => (
              <div 
                key={index} 
                className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 
                          bg-gray-50 dark:bg-slate-800/50 space-y-4 relative
                          animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Medicamento #{index + 1}
                  </h3>
                  {medicines.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMedicine(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medicine Name */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Nombre del Medicamento</Label>
                    <MedicationAutocomplete 
                      value={med.medicine_name}
                      onValueChange={(newValue) => handleMedicineChange(index, 'medicine_name', newValue)}
                    />
                  </div>

                  {/* Dosage */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Dosis</Label>
                    <Input 
                      value={med.dosage} 
                      onChange={e => handleMedicineChange(index, 'dosage', e.target.value)} 
                      placeholder="Ej: 500mg"
                      className="focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Frecuencia (horas)</Label>
                    <Input 
                      type="number" 
                      value={med.frequency_hours} 
                      onChange={e => handleMedicineChange(index, 'frequency_hours', e.target.value)} 
                      placeholder="Ej: 8"
                      min="1"
                      className="focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Duración (días)</Label>
                    <Input 
                      type="number" 
                      value={med.duration} 
                      onChange={e => handleMedicineChange(index, 'duration', e.target.value)} 
                      placeholder="Ej: 7"
                      min="1"
                      className="focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Instrucciones Adicionales</Label>
                  <Input 
                    value={med.instructions} 
                    onChange={e => handleMedicineChange(index, 'instructions', e.target.value)} 
                    placeholder="Ej: Tomar con alimentos, no tomar con lácteos..."
                    className="focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Medicine Button */}
          <Button 
            type="button" 
            onClick={addMedicine}
            variant="outline"
            className="w-full gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Agregar otro medicamento
          </Button>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end sticky bottom-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <SubmitButton />
        </div>

        {state.message && (
          <p className="text-sm font-medium text-red-500 mt-2">{state.message}</p>
        )}
      </form>
    </div>
  );
}