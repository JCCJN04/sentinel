// lib/actions/prescriptions.actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Ensure CookieOptions is imported
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Función helper para crear un cliente de Supabase en el servidor.
const createSupabaseClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Removed 'getAll' as it is not part of the expected CookieMethodsServer interface for createServerClient
                get: (name: string) => cookieStore.get(name)?.value, // 'get' method for retrieving a specific cookie
                set: (name: string, value: string, options: CookieOptions) => { // 'set' method for setting a cookie
                    try { 
                        cookieStore.set({ name, value, ...options }); 
                    } catch (error) { 
                        // This can be ignored if you have middleware refreshing user sessions,
                        // or if the set operation happens after headers have been sent.
                        console.error("Error setting cookie in createSupabaseClient:", error);
                    }
                },
                remove: (name: string, options: CookieOptions) => { // 'remove' method for deleting a cookie
                    try { 
                        cookieStore.set({ name, value: '', ...options }); 
                    } catch (error) { 
                        // Similar to 'set', this might be ignored depending on context.
                        console.error("Error removing cookie in createSupabaseClient:", error);
                    }
                },
            },
        }
    );
};

// Esquema actualizado para incluir la hora de inicio
const PrescriptionFormSchema = z.object({
    diagnosis: z.string().min(3, 'El diagnóstico es requerido.'),
    doctor_name: z.string().optional(),
    start_date: z.string().min(1, 'La fecha de inicio es requerida.'),
    start_time: z.string().min(1, 'La hora de inicio es requerida.'),
    end_date: z.string().optional().nullable(),
    notes: z.string().optional(),
    medicines: z.string().min(2, 'Debe haber al menos un medicamento.'),
});

/**
 * Crea una receta, sus medicamentos y genera el calendario de dosis.
 * Modificado para lanzar errores en lugar de retornar objetos en casos de fallo.
 */
export async function createPrescription(formData: FormData) {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('No autorizado'); // Changed to throw Error
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
        // For validation errors, if you need to display specific field errors on the client,
        // you would typically use `useFormState` and return an object, or serialize the errors
        // into the error message itself. For direct form action, throwing a general error is type-compatible.
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const errorMessage = Object.values(fieldErrors).flat().join('. ') || 'Faltan campos o son inválidos.';
        throw new Error(errorMessage); // Changed to throw Error
    }
    
    // --- PASO 1: Crear la receta principal ---
    const { diagnosis, doctor_name, start_date, start_time, end_date, notes, medicines } = validatedFields.data;
    const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([{ user_id: user.id, diagnosis, doctor_name, start_date, end_date, notes }])
        .select('id').single();

    if (prescriptionError) {
        console.error('Error al crear la receta:', prescriptionError);
        throw new Error('Error en la base de datos al crear la receta.'); // Changed to throw Error
    }

    const prescriptionId = prescriptionData.id;

    // --- PASO 2: Procesar y guardar los medicamentos ---
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
    } catch (e: any) { // Catching 'any' for e for broader compatibility
        console.error("Error al procesar medicamentos:", e);
        throw new Error(`Error en el formato de los medicamentos enviados: ${e.message || 'Error desconocido'}`); // Changed to throw Error
    }

    // --- PASO 3: Generar todas las dosis futuras ---
    const allDosesToInsert = [];
    
    // Combinamos la fecha y la hora para obtener el punto de partida exacto
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
             throw new Error('Receta creada, pero falló la generación del calendario de dosis.'); // Changed to throw Error
        }
    }

    // --- PASO 4: Redireccionar ---
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/prescriptions');
    redirect('/dashboard/prescriptions');
}


// ===== OTRAS FUNCIONES =====

/**
 * Obtiene las próximas 5 dosis pendientes.
 */
export async function getUpcomingDoses() {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado', data: [] }; // Still returns object, but not used in form action

    const { data, error } = await supabase
        .from('medication_doses')
        .select(`id, scheduled_at, prescription_medicines ( medicine_name, dosage )`)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(5);

    if (error) {
        console.error("Error fetching upcoming doses:", error);
        return { error: 'No se pudieron cargar los recordatorios.', data: [] }; // Still returns object, but not used in form action
    }
    return { data: data || [] }; // Still returns object, but not used in form action
}

/**
 * Marca una dosis como "tomada".
 * Modificado para lanzar errores en lugar de retornar objetos.
 */
export async function markDoseAsTaken(formData: FormData) {
    const doseId = formData.get('doseId') as string;
    if (!doseId) { throw new Error('ID de dosis no proporcionado'); } // Changed to throw Error

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
        throw new Error('No se pudo actualizar la dosis.'); // Changed to throw Error
    };

    revalidatePath('/dashboard');
    // No return statement needed here, as revalidatePath handles success and updates UI.
}

/**
 * Obtiene todas las recetas de un usuario.
 */
export async function getPrescriptions() {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: 'No autorizado', data: [] }; } // Still returns object

    const { data, error } = await supabase
        .from('prescriptions')
        .select(`id, diagnosis, doctor_name, start_date, prescription_medicines ( id, medicine_name, dosage, frequency_hours )`)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
    if (error) { return { error: 'No se pudieron cargar las recetas.', data: [] }; } // Still returns object
    return { data: data || [] }; // Still returns object
}

/**
 * Obtiene una receta específica por su ID.
 */
export async function getPrescriptionById(id: string) {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: 'No autorizado', data: null }; } // Still returns object
    const { data, error } = await supabase
        .from('prescriptions').select(`*, prescription_medicines (*)`).eq('id', id).eq('user_id', user.id).single();
    if (error) { return { error: 'No se pudo encontrar la receta.', data: null }; } // Still returns object
    return { data }; // Still returns object
}

/**
 * Elimina una receta y sus datos asociados.
 * Modificado para lanzar errores en lugar de retornar objetos.
 */
export async function deletePrescription(formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) { throw new Error('ID de receta no proporcionado.'); } // Changed to throw Error
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('No autorizado'); } // Changed to throw Error
    const { error } = await supabase.from('prescriptions').delete().eq('id', id);
    if (error) { throw new Error('Error en la base de datos al eliminar la receta.'); } // Changed to throw Error
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/prescriptions');
    redirect('/dashboard/prescriptions');
    // No return statement needed here as redirect terminates the function.
}