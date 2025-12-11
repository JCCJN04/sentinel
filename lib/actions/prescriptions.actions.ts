// lib/actions/prescriptions.actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { uploadRecipeImage } from './recipe-storage.actions';
import { onPrescriptionCreated } from '@/lib/alerts-hooks';

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
    start_time: z.string().optional(),
    end_date: z.string().optional().nullable().transform(val => val && val.trim() ? val : null),
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

    // Normalizar end_date vacío a null
    const rawEndDate = formData.get('end_date');
    const normalizedEndDate = rawEndDate && rawEndDate.toString().trim() !== '' ? rawEndDate : null;

    const validatedFields = PrescriptionFormSchema.safeParse({
        diagnosis: formData.get('diagnosis'),
        doctor_name: formData.get('doctor_name'),
        start_date: formData.get('start_date'),
        start_time: formData.get('start_time'),
        end_date: normalizedEndDate,
        notes: formData.get('notes'),
        medicines: formData.get('medicines'),
    });

    console.log('DEBUG - FormData recibida:', {
        diagnosis: formData.get('diagnosis'),
        doctor_name: formData.get('doctor_name'),
        start_date: formData.get('start_date'),
        start_time: formData.get('start_time'),
        end_date: formData.get('end_date'),
        notes: formData.get('notes'),
        medicines: formData.get('medicines')?.toString().substring(0, 200),
    });

    if (!validatedFields.success) {
        console.error('DEBUG - Validación falló:', validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos o son inválidos. Por favor, revisa el formulario.',
        };
    }
    
    const { diagnosis, doctor_name, start_date, start_time, end_date, notes, medicines } = validatedFields.data;
    
    // Debug: log de lo que se va a enviar
    console.log('DEBUG - Datos validados:', {
        diagnosis,
        doctor_name,
        start_date,
        start_time,
        end_date,
        notes,
        medicines: medicines ? medicines.substring(0, 100) : 'sin medicamentos'
    });
    
    // Validación defensiva de start_date
    if (!start_date || start_date.trim() === '') {
        return { message: 'La fecha de inicio no puede estar vacía.' };
    }
    
    // Obtener imagen si fue proporcionada
    const recipeImage = formData.get('recipeImage') as string | null;
    let recipeUpload: Awaited<ReturnType<typeof uploadRecipeImage>> | null = null;
    let imageWarning: string | null = null;

    // Si hay imagen, subirla
    if (recipeImage && recipeImage.trim()) {
        console.log('📸 Subiendo imagen de receta...');
        const uploadResult = await uploadRecipeImage(recipeImage, 'receta.jpg');
        
        if (uploadResult.success && uploadResult.path) {
            recipeUpload = uploadResult;
            console.log('✅ Imagen subida:', {
                path: uploadResult.path,
                fileName: uploadResult.fileName,
                storagePath: uploadResult.storagePath,
                contentType: uploadResult.contentType,
                size: uploadResult.size,
            });
        } else {
            console.error('❌ Error al subir imagen:', uploadResult.error);
            imageWarning = `Advertencia: No se pudo subir la imagen. ${uploadResult.error}. La receta se guardará sin imagen.`;
        }
    }
    
    // Construir objeto con solo los campos que tienen valor
    const prescriptionData_insert: any = {
        user_id: user.id,
        diagnosis,
        start_date: start_date.trim(),
    };
    
    if (doctor_name && doctor_name.trim()) prescriptionData_insert.doctor_name = doctor_name.trim();
    if (end_date && end_date.trim()) prescriptionData_insert.end_date = end_date.trim();
    if (notes && notes.trim()) prescriptionData_insert.notes = notes.trim();
    if (recipeUpload?.path) prescriptionData_insert.attachment_url = recipeUpload.path;
    
    console.log('DEBUG - Objeto final a insertar:', prescriptionData_insert);
    
    const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([prescriptionData_insert])
        .select('id').single();

    if (prescriptionError) {
        console.error('Error al crear la receta:', prescriptionError);
        return { message: 'Error en la base de datos al crear la receta.' };
    }

    const prescriptionId = prescriptionData.id;

    if (recipeUpload?.path) {
        const storagePath = recipeUpload.storagePath || recipeUpload.path.split('/').slice(0, -1).join('/');
        const recipeUploadPayload = {
            user_id: user.id,
            prescription_id: prescriptionId,
            file_path: recipeUpload.path,
            file_name: recipeUpload.fileName || 'receta.jpg',
            file_size: recipeUpload.size ?? null,
            file_type: recipeUpload.extension ?? recipeUpload.contentType ?? null,
            storage_path: storagePath,
        };

        const { error: recipeUploadError } = await supabase
            .from('recipe_uploads')
            .insert(recipeUploadPayload);

        if (recipeUploadError) {
            console.error('⚠️ Error guardando metadata de receta:', recipeUploadError, recipeUploadPayload);
        }

        const { data: existingDocument, error: documentLookupError } = await supabase
            .from('documents')
            .select('id')
            .eq('user_id', user.id)
            .eq('file_path', recipeUpload.path)
            .maybeSingle();

        if (documentLookupError && documentLookupError.code !== 'PGRST116') {
            console.error('⚠️ Error consultando documento existente para la receta:', documentLookupError);
        }

        if (!existingDocument) {
            const documentTags = ['Recetas'];
            if (recipeUpload.folders?.yearName) documentTags.push(recipeUpload.folders.yearName);
            if (recipeUpload.folders?.monthName) documentTags.push(recipeUpload.folders.monthName);

            const documentRecord = {
                name: `Receta - ${diagnosis}`,
                category: recipeUpload.folders?.monthName || 'Recetas',
                tags: documentTags,
                date: start_date.trim(),
                expiry_date: end_date?.trim() || null,
                status: 'vigente',
                notes: notes?.trim() || null,
                file_path: recipeUpload.path,
                file_type: recipeUpload.extension ?? recipeUpload.contentType ?? 'jpg',
                file_url: recipeUpload.url || null,
                user_id: user.id,
                doctor_name: doctor_name?.trim() || null,
                patient_name: null,
                specialty: null,
            };

            const { error: documentInsertError } = await supabase
                .from('documents')
                .insert(documentRecord);

            if (documentInsertError) {
                console.error('⚠️ Error registrando la receta en documentos:', documentInsertError, documentRecord);
            }
        }
    }

    let createdMedicines = [];
    try {
        const medicinesArray = JSON.parse(medicines);
        if (Array.isArray(medicinesArray) && medicinesArray.length > 0) {
            const medicinesToInsert = medicinesArray.map(med => ({
                prescription_id: prescriptionId,
                medicine_name: med.medicine_name,
                dosage: med.dosage,
                frequency_hours: med.frequency_hours ? parseInt(med.frequency_hours, 10) : null,
                duration: med.duration_days ? parseInt(med.duration_days, 10) : null,
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
    // Crear fecha en hora local (México) y mantenerla como tal
    // Si el usuario pone 23:20, queremos que sea 23:20 en su zona horaria
    const [year, month, day] = start_date.split('-').map(Number);
    const [hours, minutes] = (start_time || '00:00').split(':').map(Number);
    
    // Crear fecha local ajustando para UTC-6 (México)
    const prescriptionStartDate = new Date(Date.UTC(year, month - 1, day, hours + 6, minutes));
    
    console.log('🗓️ Generando calendario de dosis...');
    console.log(`📅 Fecha inicio (local): ${start_date} ${start_time || '00:00'}`);
    console.log(`📅 Fecha inicio (UTC): ${prescriptionStartDate.toISOString()}`);
    console.log(`💊 Medicamentos creados: ${createdMedicines.length}`);
    
    for (const med of createdMedicines) {
        const frequencyHours = med.frequency_hours || 0;
        const durationDays = med.duration || 0;

        console.log(`\n📋 Procesando: ${med.medicine_name}`);
        console.log(`   ⏰ Frecuencia: ${frequencyHours}h`);
        console.log(`   📆 Duración: ${durationDays} días`);

        if (frequencyHours > 0 && durationDays > 0) {
            const totalDoses = Math.floor((durationDays * 24) / frequencyHours);
            console.log(`   💉 Total dosis a generar: ${totalDoses}`);
            
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
        } else {
            console.log(`   ⚠️ Saltando (frecuencia o duración = 0)`);
        }
    }

    console.log(`\n✅ Total dosis programadas: ${allDosesToInsert.length}`);

    if (allDosesToInsert.length > 0) {
        const { error: dosesError } = await supabase.from('medication_doses').insert(allDosesToInsert);
        if (dosesError) {
             console.error('❌ Error al generar las dosis:', dosesError);
             return { message: 'Receta creada, pero falló la generación del calendario de dosis.' };
        }
        console.log('✅ Dosis insertadas en la BD correctamente');
    } else {
        console.log('⚠️ No se generaron dosis (medicamentos sin frecuencia/duración)');
    }

    // 🆕 Generar alertas automáticas solo si la prescripción es reciente (no más de 1 día en el pasado)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isFuturePrescription = prescriptionStartDate >= oneDayAgo;
    
    if (createdMedicines.length > 0 && isFuturePrescription) {
        console.log('✅ Generando alertas automáticas para prescripción reciente');
        const medicinesForAlert = createdMedicines.map(m => ({
            id: m.id,
            name: m.medicine_name,
            dosage: m.dosage || '',
            frequency_hours: m.frequency_hours || 24
        }));
        
        onPrescriptionCreated({
            userId: user.id,
            prescriptionId: prescriptionId,
            medicines: medicinesForAlert,
            startDate: prescriptionStartDate.toISOString()
        }).catch(err => console.error('Error generando alertas de medicamentos:', err));
    } else if (!isFuturePrescription) {
        console.log('⏭️ Prescripción antigua detectada - no se generan alertas automáticas');
    }

    // Si hay warning de imagen, agregarlo al mensaje
    if (imageWarning) {
        console.warn('⚠️', imageWarning);
        // No bloqueamos el guardado, solo advertimos
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/prescriptions');
    revalidatePath('/dashboard/documentos');
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
        instructions: string | null;
        frequency_hours: number | null;
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

    // Obtener solo dosis futuras (desde ahora en adelante)
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('medication_doses')
        .select(`id, scheduled_at, prescription_medicines ( medicine_name, dosage, instructions, frequency_hours )`)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(5);

    if (error) {
        console.error("Error fetching upcoming doses:", error);
        return { error: 'No se pudieron cargar los recordatorios.', data: [] };
    }

    // 3. Se transforman los datos recibidos para que coincidan con el tipo esperado
    const mappedData: UpcomingDose[] = (data || []).map(dose => {
        const rawMedicine = Array.isArray(dose.prescription_medicines)
            ? dose.prescription_medicines[0]
            : dose.prescription_medicines;

        const normalizedMedicine = rawMedicine
            ? {
                medicine_name: rawMedicine.medicine_name ?? 'Medicamento',
                dosage: rawMedicine.dosage ?? '',
                instructions: rawMedicine.instructions ?? null,
                frequency_hours: rawMedicine.frequency_hours !== undefined && rawMedicine.frequency_hours !== null
                    ? Number(rawMedicine.frequency_hours)
                    : null,
            }
            : null;

        return {
            id: dose.id,
            scheduled_at: dose.scheduled_at,
            prescription_medicines: normalizedMedicine,
        };
    });

    return { data: mappedData, error: null };
}

// markDoseAsTaken - Mejorado con feedback
export async function markDoseAsTaken(formData: FormData) {
    const doseId = formData.get('doseId') as string;
    if (!doseId) { 
        return { success: false, error: 'ID de dosis no proporcionado' };
    }
    
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { success: false, error: 'No autorizado' };
    }
    
    // Primero verificar que la dosis existe y pertenece al usuario
    const { data: dose, error: fetchError } = await supabase
        .from('medication_doses')
        .select('id, user_id, scheduled_at')
        .eq('id', doseId)
        .eq('user_id', user.id)
        .single();
    
    if (fetchError || !dose) {
        console.error('Error al buscar la dosis:', fetchError);
        return { success: false, error: 'Dosis no encontrada' };
    }
    
    // Actualizar la dosis
    const { error } = await supabase
        .from('medication_doses')
        .update({ 
            taken_at: new Date().toISOString(),
            status: 'taken' 
        })
        .eq('id', doseId);
    
    if (error) {
        console.error('Error al actualizar la dosis:', error);
        return { success: false, error: 'No se pudo registrar la toma' };
    }
    
    revalidatePath('/dashboard');
    return { success: true };
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