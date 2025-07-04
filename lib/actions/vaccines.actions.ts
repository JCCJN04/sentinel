'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Tipos de datos
export type VaccineCatalogItem = {
  name: string;
  disease_protected: string;
}

export type VaccineRecord = {
  id: string;
  vaccine_name: string;
  disease_protected: string | null;
  dose_details: string | null;
  administration_date: string;
  lot_number: string | null;
  application_site: string | null;
}

// Esquema de validación para el formulario
const VaccineSchema = z.object({
  vaccine_name: z.string().min(1, 'Debes seleccionar una vacuna.'),
  disease_protected: z.string(),
  administration_date: z.string().min(1, 'La fecha es requerida.'),
  dose_details: z.string().optional(),
  lot_number: z.string().optional(),
  application_site: z.string().optional(),
})

// Obtener el catálogo de vacunas
export async function getVaccineCatalog(): Promise<VaccineCatalogItem[]> {
  const supabase = createClient()
  const { data } = await supabase.from('vaccine_catalog').select('name, disease_protected')
  return data || []
}

// Obtener las vacunas de un usuario
export async function getVaccinesForUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: [] }

  const { data, error } = await supabase
    .from('vaccinations')
    .select('id, vaccine_name, disease_protected, dose_details, administration_date, lot_number, application_site')
    .eq('user_id', user.id)
    .order('administration_date', { ascending: false })

  if (error) return { error: 'No se pudieron cargar las vacunas.', data: [] }
  return { error: null, data: data as VaccineRecord[] }
}

// Añadir un nuevo registro de vacuna
export async function addVaccine(formData: VaccineForm) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const validatedFields = VaccineSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { success: false, error: 'Datos inválidos.' }
  }

  const { error } = await supabase.from('vaccinations').insert({ ...validatedFields.data, user_id: user.id })
  if (error) return { success: false, error: 'No se pudo añadir la vacuna.' }

  revalidatePath('/dashboard/vacunas')
  return { success: true }
}

// Eliminar un registro de vacuna
export async function deleteVaccine(vaccineId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('vaccinations').delete().eq('id', vaccineId)
  if (error) return { success: false, error: 'No se pudo eliminar la vacuna.' }

  revalidatePath('/dashboard/vacunas')
  return { success: true }
}

export type VaccineForm = z.infer<typeof VaccineSchema>