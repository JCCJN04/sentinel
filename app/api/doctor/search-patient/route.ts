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

    // Since we can't search by email directly without admin access,
    // we'll return an error suggesting the invitation system
    return NextResponse.json(
      { error: 'Para proteger la privacidad de los pacientes, usa el sistema de invitaciones. El paciente debe aceptar la solicitud.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error searching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
