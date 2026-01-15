import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type PatientDoctor = {
  id: string
  doctor_id: string
  patient_id: string
  status: string
  patient_notes: string | null
  last_consultation_date: string | null
  created_at: string
  doctor_profile?: {
    id: string
    specialty: string | null
    license_number: string | null
    phone_number: string | null
    user_id: string
  }
  doctor_user?: {
    first_name: string
    last_name: string
  }
}

export async function getPatientDoctors() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await serviceSupabase
    .from('doctor_patients')
    .select('*')
    .eq('patient_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  if (!data || data.length === 0) return []
  
  // Get doctor profiles and user info
  const doctorIds = data.map(d => d.doctor_id)
  
  const { data: doctorProfiles } = await serviceSupabase
    .from('doctor_profiles')
    .select('*')
    .in('id', doctorIds)
  
  const userIds = doctorProfiles?.map(dp => dp.user_id) || []
  const { data: doctorUsers } = await serviceSupabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds)
  
  return data.map(d => ({
    ...d,
    doctor_profile: doctorProfiles?.find(dp => dp.id === d.doctor_id),
    doctor_user: doctorUsers?.find(du => du.id === doctorProfiles?.find(dp => dp.id === d.doctor_id)?.user_id)
  }))
}

export async function revokePatientDoctorAccess(doctorPatientId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Update status to inactive instead of deleting
  const { error } = await serviceSupabase
    .from('doctor_patients')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', doctorPatientId)
    .eq('patient_id', user.id)
  
  if (error) throw error
  
  return { success: true }
}

export async function shareDocumentWithDoctor(
  doctorId: string,
  documentId: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Check if already shared
  const { data: existing } = await serviceSupabase
    .from('shared_documents_with_doctor')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('document_id', documentId)
    .eq('patient_id', user.id)
    .maybeSingle()
  
  if (existing) {
    return { error: 'Este documento ya está compartido con el doctor' }
  }
  
  // Share document
  const { error } = await serviceSupabase
    .from('shared_documents_with_doctor')
    .insert({
      doctor_id: doctorId,
      document_id: documentId,
      patient_id: user.id,
      shared_at: new Date().toISOString()
    })
  
  if (error) throw error
  
  return { success: true }
}
