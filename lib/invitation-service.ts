import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type DoctorInvitation = {
  id: string
  doctor_id: string
  patient_email: string
  patient_id: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  message: string | null
  created_at: string
  updated_at: string
  expires_at: string
  doctor_profiles?: {
    id: string
    specialty: string | null
    license_number: string | null
    user_id: string
  }
  doctor_user?: {
    first_name: string
    last_name: string
  }
}

export async function getPatientInvitations() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS for reading invitations
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Get invitations where patient_id matches OR where we need to link by email
  const { data, error } = await serviceSupabase
    .from('doctor_patient_invitations')
    .select('*')
    .eq('status', 'pending')
    .or(`patient_id.eq.${user.id},patient_email.eq.${user.email}`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Update invitations with patient_id if they were found by email
  if (data) {
    const emailInvitations = data.filter(inv => inv.patient_email === user.email && !inv.patient_id)
    if (emailInvitations.length > 0) {
      await serviceSupabase
        .from('doctor_patient_invitations')
        .update({ patient_id: user.id })
        .in('id', emailInvitations.map(inv => inv.id))
    }
  }
  
  if (!data || data.length === 0) return []
  
  const doctorIds = data.map(inv => inv.doctor_id)
    
  const { data: doctorProfiles } = await serviceSupabase
    .from('doctor_profiles')
    .select('id, specialty, license_number, user_id')
    .in('id', doctorIds)
    
  const userIds = doctorProfiles?.map(dp => dp.user_id) || []
  const { data: doctorUsers } = await serviceSupabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds)
    
  return data.map(inv => ({
    ...inv,
    doctor_profiles: doctorProfiles?.find(dp => dp.id === inv.doctor_id),
    doctor_user: doctorUsers?.find(du => du.id === doctorProfiles?.find(dp => dp.id === inv.doctor_id)?.user_id)
  }))
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Get invitation details
  const { data: invitation, error: invError } = await serviceSupabase
    .from('doctor_patient_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()
  
  if (invError) throw invError
  if (!invitation) throw new Error('Invitation not found')
  
  // Update invitation status to accepted
  const { error: updateError } = await serviceSupabase
    .from('doctor_patient_invitations')
    .update({
      status: 'accepted',
      patient_id: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)
  
  if (updateError) throw updateError
  
  // Create doctor-patient relationship
  const { error: relationError } = await serviceSupabase
    .from('doctor_patients')
    .insert({
      doctor_id: invitation.doctor_id,
      patient_id: user.id,
      patient_notes: invitation.message,
      status: 'active'
    })
  
  if (relationError) {
    // If relationship already exists, just update it
    if (relationError.code === '23505') {
      await serviceSupabase
        .from('doctor_patients')
        .update({ status: 'active' })
        .eq('doctor_id', invitation.doctor_id)
        .eq('patient_id', user.id)
    } else {
      throw relationError
    }
  }
  
  return { success: true }
}

export async function rejectInvitation(invitationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user')
  
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Update invitation status to rejected
  const { error } = await serviceSupabase
    .from('doctor_patient_invitations')
    .update({
      status: 'rejected',
      patient_id: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)
  
  if (error) throw error
  
  return { success: true }
}
