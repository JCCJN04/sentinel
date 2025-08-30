// lib/actions/prescriptions.actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Función helper (sin cambios)
const createSupabaseClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options: CookieOptions) => {
                    try { cookieStore.set({ name, value, ...options }); } catch (error) { console.error("Error setting cookie:", error); }
                },
                remove: (name: string, options: CookieOptions) => {
                    try { cookieStore.set({ name, value: '', ...options }); } catch (error) { console.error("Error removing cookie:", error); }
                },
            },
        }
    );
};

// Esquema de validación y estado del formulario (sin cambios)
const PrescriptionFormSchema = z.object({
    diagnosis: z.string().min(3, 'El diagnóstico debe tener al menos 3 caracteres.'),
    doctor_name: z.string().optional(),
    start_date: z.string().min(1, 'La fecha de inicio es requerida.'),
    start_time: z.string().min(1, 'La hora de inicio es requerida.'),
    end_date: z.string().optional().nullable(),
    notes: z.string().optional(),
    medicines: z.string().min(2, 'Debe haber al menos un medicamento.'),
});

export type PrescriptionFormState = {
  errors?: {
    diagnosis?: string[];
    doctor_name?: string[];
    start_date?: string[];
    start_time?: string[];
    end_date?: string[];
    notes?: string[];
    medicines?: string[];
  };
  message?: string | null;
};

// Función createPrescription (sin cambios)
export async function createPrescription(
    prevState: PrescriptionFormState,
    formData: FormData
): Promise<PrescriptionFormState> {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: 'No autorizado.' };
    }

    const validatedFields = PrescriptionFormSchema.safeParse({
        diagnosis: formData.get('diagnosis'),
        doctor_name: formData.get('doctor_name'),
        start_date: formData.get('start_date'),
        start_time: formData.get('start_time'),
        end_date: formData.get('end_date'),
        notes: formData.get('notes'),
        medicines: formData.get('medicines'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos o son inválidos. Por favor, revisa el formulario.',
        };
    }
    
    const { diagnosis, doctor_name, start_date, start_time, end_date, notes, medicines } = validatedFields.data;
    const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([{ user_id: user.id, diagnosis, doctor_name, start_date, end_date, notes }])
        .select('id').single();

    if (prescriptionError) {
        console.error('Error al crear la receta:', prescriptionError);
        return { message: 'Error en la base de datos al crear la receta.' };
    }

    const prescriptionId = prescriptionData.id;

    let createdMedicines = [];
    try {
        const medicinesArray = JSON.parse(medicines);
        if (Array.isArray(medicinesArray) && medicinesArray.length > 0) {
            const medicinesToInsert = medicinesArray.map(med => ({
                prescription_id: prescriptionId,
                medicine_name: med.medicine_name,
                dosage: med.dosage,
                frequency_hours: med.frequency_hours ? parseInt(med.frequency_hours, 10) : null,
                duration: med.duration ? parseInt(med.duration, 10) : null,
                instructions: med.instructions,
            }));

            const { data: createdMedicinesData, error: medicinesError } = await supabase
                .from('prescription_medicines').insert(medicinesToInsert).select();
            if (medicinesError) { throw medicinesError; }
            createdMedicines = createdMedicinesData || [];
        }
    } catch (e: any) {
        console.error("Error al procesar medicamentos:", e);
        return { message: `Error en el formato de los medicamentos enviados: ${e.message || 'Error desconocido'}`};
    }

    const allDosesToInsert = [];
    const prescriptionStartDate = new Date(`${start_date}T${start_time}`);
    
    for (const med of createdMedicines) {
        const frequencyHours = med.frequency_hours || 0;
        const durationDays = med.duration || 0;

        if (frequencyHours > 0 && durationDays > 0) {
            const totalDoses = Math.floor((durationDays * 24) / frequencyHours);
            for (let i = 0; i < totalDoses; i++) {
                const scheduledTime = new Date(prescriptionStartDate.getTime());
                scheduledTime.setHours(scheduledTime.getHours() + (i * frequencyHours));
                
                allDosesToInsert.push({
                    user_id: user.id,
                    prescription_medicine_id: med.id,
                    scheduled_at: scheduledTime.toISOString(),
                    status: 'scheduled'
                });
            }
        }
    }

    if (allDosesToInsert.length > 0) {
        const { error: dosesError } = await supabase.from('medication_doses').insert(allDosesToInsert);
        if (dosesError) {
             console.error('Error al generar las dosis:', dosesError);
             return { message: 'Receta creada, pero falló la generación del calendario de dosis.' };
        }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/prescriptions');
    redirect('/dashboard/prescriptions');
}


// ===== OTRAS FUNCIONES =====

// --- MODIFICACIÓN CLAVE ---

// 1. Se define y exporta un tipo explícito para la forma final de los datos
export type UpcomingDose = {
    id: string;
    scheduled_at: string;
    prescription_medicines: {
        medicine_name: string;
        dosage: string;
    } | null; // Es un objeto o null
};

/**
 * Obtiene las próximas 5 dosis pendientes.
 */
// 2. La función se actualiza para transformar los datos
export async function getUpcomingDoses(): Promise<{ data: UpcomingDose[], error?: string | null }> {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado', data: [] };

    // La consulta no cambia
    const { data, error } = await supabase
        .from('medication_doses')
        .select(`id, scheduled_at, prescription_medicines ( medicine_name, dosage )`)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(5);

    if (error) {
        console.error("Error fetching upcoming doses:", error);
        return { error: 'No se pudieron cargar los recordatorios.', data: [] };
    }

    // 3. Se transforman los datos recibidos para que coincidan con el tipo esperado
    const mappedData: UpcomingDose[] = (data || []).map(dose => ({
        id: dose.id,
        scheduled_at: dose.scheduled_at,
        // Se toma el primer elemento del array de medicamentos, o null si está vacío
        prescription_medicines: (dose.prescription_medicines && Array.isArray(dose.prescription_medicines) && dose.prescription_medicines.length > 0)
            ? dose.prescription_medicines[0]
            : null
    }));

    return { data: mappedData, error: null };
}

// markDoseAsTaken (sin cambios)
export async function markDoseAsTaken(formData: FormData) {
    const doseId = formData.get('doseId') as string;
    if (!doseId) { throw new Error('ID de dosis no proporcionado'); }
    const supabase = createSupabaseClient();
    const { error } = await supabase
        .from('medication_doses')
        .update({ 
            taken_at: new Date().toISOString(),
            status: 'taken' 
        })
        .eq('id', doseId);
    if (error) {
        console.error('Error al actualizar la dosis:', error);
        throw new Error('No se pudo actualizar la dosis.');
    };
    revalidatePath('/dashboard');
}

// getPrescriptions (sin cambios)
export async function getPrescriptions() {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: 'No autorizado', data: [] }; }
    const { data, error } = await supabase
        .from('prescriptions')
        .select(`id, diagnosis, doctor_name, start_date, prescription_medicines ( id, medicine_name, dosage, frequency_hours )`)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
    if (error) { return { error: 'No se pudieron cargar las recetas.', data: [] }; }
    return { data: data || [] };
}

// getPrescriptionById (sin cambios)
export async function getPrescriptionById(id: string) {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: 'No autorizado', data: null }; }
    const { data, error } = await supabase
        .from('prescriptions').select(`*, prescription_medicines (*)`).eq('id', id).eq('user_id', user.id).single();
    if (error) { return { error: 'No se pudo encontrar la receta.', data: null }; }
    return { data };
}

// deletePrescription (sin cambios)
export async function deletePrescription(formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) { throw new Error('ID de receta no proporcionado.'); }
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('No autorizado'); }
    const { error } = await supabase.from('prescriptions').delete().eq('id', id);
    if (error) { throw new Error('Error en la base de datos al eliminar la receta.'); }
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/prescriptions');
    redirect('/dashboard/prescriptions');
}