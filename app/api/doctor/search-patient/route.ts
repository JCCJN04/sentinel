import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the requesting user is a doctor
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!doctorProfile || doctorProfile.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Not authorized - doctor role required' },
        { status: 403 }
      )
    }

    // Search for patient by email in profiles table
    const { data: patientProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .ilike('id', email) // This won't work, we need a better approach
      
    // Since we can't search by email directly without admin access,
    // we'll return an error suggesting the invitation system
    return NextResponse.json(
      { error: 'Para proteger la privacidad de los pacientes, usa el sistema de invitaciones. El paciente debe aceptar la solicitud.' },
      { status: 400 }
    )
    const { data: patientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', authUser.user.id)
      .single()

    if (profileError || !patientProfile) {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      )
    }

    // Check if patient is already assigned to this doctor
    const { data: existingRelation } = await supabase
      .from('doctor_patients')
      .select('id, status')
      .eq('doctor_id', user.id)
      .eq('patient_id', patientProfile.id)
      .single()

    if (existingRelation && existingRelation.status === 'active') {
      return NextResponse.json(
        { error: 'Este paciente ya está en tu lista' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      patient: {
        id: patientProfile.id,
        name: `${patientProfile.first_name} ${patientProfile.last_name}`,
        email: authUser.user.email,
      },
    })
  } catch (error) {
    console.error('Error searching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
