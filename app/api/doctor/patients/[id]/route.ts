import { NextRequest, NextResponse } from 'next/server'
import { getDoctorPatients, getCurrentDoctorProfile } from '@/lib/doctor-service'
import { 
  getDoctorSharedResources, 
  getDoctorAccessiblePrescriptions, 
  getDoctorAccessibleDocuments,
  getDoctorAccessibleMedications,
  getDoctorAccessibleAllergies,
  getDoctorAccessibleVaccines,
  getDoctorAccessibleAntecedentes
} from '@/lib/shared-resources-service'
import { getFullName } from '@/lib/utils/profile-helpers'
import { differenceInYears } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorProfile = await getCurrentDoctorProfile()
    const patientsData = await getDoctorPatients(doctorProfile.id)
    
    const patientData = patientsData.find((p: any) => p.patient_id === params.id)
    
    if (!patientData) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    
    const dateOfBirth = patientData.patient?.profiles?.date_of_birth
    const age = dateOfBirth ? differenceInYears(new Date(), new Date(dateOfBirth)) : null
    
    const fullName = getFullName(patientData.patient?.profiles)
    const hasName = fullName !== 'Sin nombre'
    
    const patient = {
      id: patientData.patient_id,
      name: fullName,
      hasName,
      age: age,
      sex: patientData.patient?.profiles?.sex,
      lastVisit: patientData.last_consultation_date || new Date().toISOString(),
      conditions: [],
    }

    const [sharedResources, documentsData, prescriptionsData, medications, allergies, vaccines, antecedentes] = await Promise.all([
      getDoctorSharedResources(params.id).catch(() => []),
      getDoctorAccessibleDocuments(params.id).catch(() => []),
      getDoctorAccessiblePrescriptions(params.id).catch(() => []),
      getDoctorAccessibleMedications(params.id).catch(() => []),
      getDoctorAccessibleAllergies(params.id).catch(() => []),
      getDoctorAccessibleVaccines(params.id).catch(() => []),
      getDoctorAccessibleAntecedentes(params.id).catch(() => []),
    ])
    
    const documents = documentsData.map((d: any) => ({
      id: d.id,
      title: d.name || d.title || 'Sin título',
      category: d.category || 'General',
      fileType: d.file_type || 'unknown',
      uploadedAt: d.created_at || d.uploaded_at || new Date().toISOString(),
      url: d.signed_url || '#',
    }))
    
    const prescriptions = prescriptionsData.map((p: any) => ({
      id: p.id,
      medication: p.medicine_name || 'Medicamento',
      dosage: p.dosage || 'N/A',
      frequency: p.frequency_hours ? `Cada ${p.frequency_hours}h` : 'N/A',
      startDate: p.prescriptions?.start_date || p.created_at,
      endDate: p.prescriptions?.end_date,
      notes: p.instructions,
    }))

    return NextResponse.json({
      patient,
      documents,
      prescriptions,
      medications,
      allergies,
      vaccines,
      antecedentes,
      sharedResources
    })
  } catch (error: any) {
    console.error('Error loading patient data:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cargar datos del paciente' },
      { status: 500 }
    )
  }
}
