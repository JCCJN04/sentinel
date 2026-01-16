import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('documentId')
    const patientId = searchParams.get('patientId')

    if (!documentId || !patientId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get doctor profile
    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Get notes
    const { data: notes, error } = await supabase
      .from('doctor_document_notes')
      .select(`
        *,
        doctor_profiles (
          id,
          specialty,
          professional_id,
          years_experience,
          consultation_fee,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq('doctor_id', doctorProfile.id)
      .eq('patient_id', patientId)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error('Error in GET /api/doctor/document-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, patientId, note } = body

    if (!documentId || !patientId || !note) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get doctor profile
    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Insert note
    const { data, error } = await supabase
      .from('doctor_document_notes')
      .insert({
        doctor_id: doctorProfile.id,
        patient_id: patientId,
        document_id: documentId,
        note: note
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving note:', error)
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
    }

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('Error in POST /api/doctor/document-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
