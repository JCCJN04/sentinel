'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Tipos de datos
export type PersonalHistory = {
  id: string;
  condition_name: string;
  diagnosis_date: string | null;
  notes: string | null;
}

export type FamilyHistory = {
  id: string;
  condition_name: string;
  family_member: string;
  notes: string | null;
}

// Obtener todos los antecedentes de un usuario
export async function getMedicalHistory() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { personal: [], family: [] }

  const [personal, family] = await Promise.all([
    supabase.from('user_personal_history').select('*').eq('user_id', user.id),
    supabase.from('user_family_history').select('*').eq('user_id', user.id)
  ])

  return {
    personal: personal.data || [],
    family: family.data || [],
  }
}

// Obtener el catálogo de enfermedades
export async function getConditionsCatalog() {
    const supabase = createClient()
    const { data } = await supabase.from('medical_conditions_catalog').select('name')
    return data?.map(c => c.name) || []
}

// Añadir un antecedente personal
export async function addPersonalHistory(data: Omit<PersonalHistory, 'id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('user_personal_history').insert({ ...data, user_id: user.id })
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/antecedentes')
  return { success: true }
}

// Añadir un antecedente familiar
export async function addFamilyHistory(data: Omit<FamilyHistory, 'id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('user_family_history').insert({ ...data, user_id: user.id })
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/antecedentes')
  return { success: true }
}

// Eliminar un antecedente
export async function deleteHistoryRecord(id: string, type: 'personal' | 'family') {
  const supabase = createClient()
  const tableName = type === 'personal' ? 'user_personal_history' : 'user_family_history'
  
  const { error } = await supabase.from(tableName).delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/antecedentes')
  return { success: true }
}