"use server"

import { addPatientToDoctor } from "@/lib/doctor-service"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function addPatientToDoctorAction({
  doctorId,
  patientId,
  notes,
}: {
  doctorId: string
  patientId: string
  notes?: string
}) {
  try {
    await addPatientToDoctor(doctorId, patientId, notes)
    return { success: true }
  } catch (error) {
    console.error("Error adding patient to doctor:", error)
    throw error
  }
}

export async function sendPatientInvitationAction({
  doctorId,
  patientEmail,
  message,
}: {
  doctorId: string
  patientEmail: string
  message?: string
}) {
  try {
    // Verify the requesting user is authenticated and is the doctor
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'No autenticado' }
    }

    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id, user_id')
      .eq('id', doctorId)
      .eq('user_id', user.id)
      .single()

    if (!doctorProfile) {
      return { error: 'No tienes permiso para enviar invitaciones' }
    }

    // Use service role to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if there's already a pending invitation
    const { data: existing } = await serviceSupabase
      .from('doctor_patient_invitations')
      .select('id, status')
      .eq('doctor_id', doctorId)
      .eq('patient_email', patientEmail.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return { error: 'Ya existe una invitación pendiente para este paciente.' }
    }

    // Create invitation
    const { data, error } = await serviceSupabase
      .from('doctor_patient_invitations')
      .insert({
        doctor_id: doctorId,
        patient_email: patientEmail.toLowerCase(),
        patient_id: null,
        message: message || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      return { error: 'No se pudo crear la invitación: ' + error.message }
    }

    return { success: true, invitation: data }
  } catch (error: any) {
    console.error("Error sending invitation:", error)
    return { error: error.message || 'Error al enviar la invitación' }
  }
}
