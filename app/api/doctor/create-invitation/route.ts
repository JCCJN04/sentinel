import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { doctorId, patientEmail, message } = await request.json()

    if (!doctorId || !patientEmail) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Verify the requesting user is authenticated and is the doctor
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id, user_id')
      .eq('id', doctorId)
      .eq('user_id', user.id)
      .single()

    if (!doctorProfile) {
      return NextResponse.json(
        { error: 'No tienes permiso para enviar invitaciones' },
        { status: 403 }
      )
    }

    // Use service role to bypass RLS for creating invitation
    const serviceSupabase = createClient(
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
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este paciente.' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'No se pudo crear la invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, invitation: data })
  } catch (error) {
    console.error('Error in create-invitation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
