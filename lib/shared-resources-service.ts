// lib/shared-resources-service.ts
import { createClient, createServiceClient } from "@/lib/supabase/server"

export type ResourceType = 
  | 'document'
  | 'prescription'
  | 'medication'
  | 'allergy'
  | 'vaccine'
  | 'antecedente'
  | 'report'
  | 'all_documents'
  | 'all_prescriptions'
  | 'all_medications'
  | 'all_allergies'
  | 'all_vaccines'
  | 'all_antecedentes'
  | 'all_reports'

export interface SharedResource {
  id: string
  patient_id: string
  doctor_id: string
  resource_type: ResourceType
  resource_id: string | null
  shared_at: string
  expires_at: string | null
  notes: string | null
}

export interface ShareResourceParams {
  doctor_id: string
  resource_type: ResourceType
  resource_id?: string | null
  expires_at?: string | null
  notes?: string | null
}

export interface SharedResourceSummary {
  resource_type: string
  count: number
  has_all_access: boolean
}

/**
 * Share a resource with a doctor
 */
export async function shareResourceWithDoctor(params: ShareResourceParams): Promise<SharedResource> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('shared_resources_with_doctor')
    .insert({
      patient_id: user.id,
      doctor_id: params.doctor_id,
      resource_type: params.resource_type,
      resource_id: params.resource_id || null,
      expires_at: params.expires_at || null,
      notes: params.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sharing resource:', error)
    throw new Error(`Failed to share resource: ${error.message}`)
  }

  return data
}

/**
 * Get all resources shared with a specific doctor by current patient
 */
export async function getSharedResourcesWithDoctor(doctorId: string): Promise<SharedResource[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('*')
    .eq('patient_id', user.id)
    .eq('doctor_id', doctorId)
    .order('shared_at', { ascending: false })

  if (error) {
    console.error('Error fetching shared resources:', error)
    throw new Error(`Failed to fetch shared resources: ${error.message}`)
  }

  return data || []
}

/**
 * Get summary of shared resources with a doctor
 */
export async function getSharedResourcesSummary(doctorId: string): Promise<SharedResourceSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .rpc('get_shared_resources_summary', {
      p_doctor_id: doctorId,
      p_patient_id: user.id
    })

  if (error) {
    console.error('Error fetching shared resources summary:', error)
    throw new Error(`Failed to fetch summary: ${error.message}`)
  }

  return data || []
}

/**
 * Revoke a shared resource
 */
export async function revokeSharedResource(shareId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  const { error } = await serviceClient
    .from('shared_resources_with_doctor')
    .delete()
    .eq('id', shareId)
    .eq('patient_id', user.id)

  if (error) {
    console.error('Error revoking shared resource:', error)
    throw new Error(`Failed to revoke resource: ${error.message}`)
  }
}

/**
 * Revoke all resources of a specific type shared with a doctor
 */
export async function revokeAllResourcesOfType(
  doctorId: string,
  resourceType: ResourceType
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  const { error } = await serviceClient
    .from('shared_resources_with_doctor')
    .delete()
    .eq('patient_id', user.id)
    .eq('doctor_id', doctorId)
    .eq('resource_type', resourceType)

  if (error) {
    console.error('Error revoking resources:', error)
    throw new Error(`Failed to revoke resources: ${error.message}`)
  }
}

/**
 * Check if a doctor has access to a specific resource
 */
export async function checkDoctorAccess(
  doctorId: string,
  resourceType: ResourceType,
  resourceId?: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .rpc('doctor_has_access_to_resource', {
      p_doctor_id: doctorId,
      p_patient_id: user.id,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null
    })

  if (error) {
    console.error('Error checking doctor access:', error)
    return false
  }

  return data || false
}

/**
 * Get all resources shared with current doctor by a specific patient
 */
export async function getDoctorSharedResources(patientId: string): Promise<SharedResource[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  // First get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) {
    throw new Error('Doctor profile not found')
  }

  const { data, error } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('*')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .order('shared_at', { ascending: false })

  if (error) {
    console.error('Error fetching doctor shared resources:', error)
    throw new Error(`Failed to fetch shared resources: ${error.message}`)
  }

  return data || []
}

/**
 * Get all doctors who have access to a specific resource
 */
export async function getDoctorsWithAccessToResource(
  resourceType: ResourceType,
  resourceId?: string
): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  
  // Get all shares for this resource
  let query = serviceClient
    .from('shared_resources_with_doctor')
    .select(`
      id,
      doctor_id,
      resource_type,
      shared_at,
      expires_at,
      notes,
      doctor_profiles (
        id,
        user_id,
        specialty,
        license_number,
        phone,
        profiles (
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq('patient_id', user.id)
    .eq('resource_type', resourceType)

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  } else {
    query = query.is('resource_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching doctors with access:', error)
    throw new Error(`Failed to fetch doctors: ${error.message}`)
  }

  return data || []
}

/**
 * Get patient's shared prescriptions for current doctor
 */
export async function getDoctorAccessiblePrescriptions(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to prescriptions
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_prescriptions,resource_type.eq.prescription')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all prescriptions
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_prescriptions')

  // Get prescriptions
  let query = serviceClient
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('start_date', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const prescriptionIds = sharedResources
      .filter(r => r.resource_type === 'prescription' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (prescriptionIds.length === 0) return []
    query = query.in('id', prescriptionIds)
  }

  const { data } = await query
  return data || []
}

/**
 * Get patient's shared documents for current doctor
 */
export async function getDoctorAccessibleDocuments(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('[getDoctorAccessibleDocuments] No user authenticated')
    return []
  }

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile, error: doctorError } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile || doctorError) {
    console.log('[getDoctorAccessibleDocuments] Doctor profile not found:', doctorError)
    return []
  }

  console.log('[getDoctorAccessibleDocuments] Doctor ID:', doctorProfile.id, 'Patient ID:', patientId)

  // Check if doctor has access to documents
  const { data: sharedResources, error: sharedError } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_documents,resource_type.eq.document')

  console.log('[getDoctorAccessibleDocuments] Shared resources:', sharedResources, 'Error:', sharedError)

  if (!sharedResources || sharedResources.length === 0) {
    console.log('[getDoctorAccessibleDocuments] No shared resources found')
    return []
  }

  // Check if has access to all documents
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_documents')
  console.log('[getDoctorAccessibleDocuments] Has all access:', hasAllAccess)

  // Get documents
  let query = serviceClient
    .from('documents')
    .select('*')
    .eq('user_id', patientId)
    .order('created_at', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const documentIds = sharedResources
      .filter(r => r.resource_type === 'document' && r.resource_id)
      .map(r => r.resource_id!)
    
    console.log('[getDoctorAccessibleDocuments] Specific document IDs:', documentIds)
    
    if (documentIds.length === 0) {
      console.log('[getDoctorAccessibleDocuments] No specific document IDs found')
      return []
    }
    query = query.in('id', documentIds)
  }

  const { data, error: docsError } = await query
  console.log('[getDoctorAccessibleDocuments] Documents found:', data?.length, 'Error:', docsError)
  
  // Generate signed URLs for documents
  if (data && data.length > 0) {
    const documentsWithUrls = await Promise.all(
      data.map(async (doc) => {
        try {
          const { data: urlData } = await serviceClient.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600) // URL válida por 1 hora
          
          return {
            ...doc,
            signed_url: urlData?.signedUrl || null
          }
        } catch (error) {
          console.error('[getDoctorAccessibleDocuments] Error generating signed URL for:', doc.id, error)
          return {
            ...doc,
            signed_url: null
          }
        }
      })
    )
    return documentsWithUrls
  }
  
  return data || []
}

/**
 * Get patient's shared consultations for current doctor
 */
export async function getDoctorAccessibleConsultations(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Get consultations where this doctor is involved
  const { data } = await serviceClient
    .from('consultations')
    .select('*')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorProfile.id)
    .order('scheduled_at', { ascending: false })

  return data || []
}

/**
 * Get patient's shared medications for current doctor
 */
export async function getDoctorAccessibleMedications(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to medications
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_medications,resource_type.eq.medication')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all medications
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_medications')

  // Get medications from prescription_medicines
  let query = serviceClient
    .from('prescription_medicines')
    .select(`
      *,
      prescriptions (
        diagnosis,
        doctor_name,
        start_date,
        end_date
      )
    `)
    .eq('prescriptions.user_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const medicationIds = sharedResources
      .filter(r => r.resource_type === 'medication' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (medicationIds.length === 0) return []
    query = query.in('id', medicationIds)
  }

  const { data } = await query
  return data || []
}

/**
 * Get patient's shared allergies for current doctor
 */
export async function getDoctorAccessibleAllergies(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to allergies
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_allergies,resource_type.eq.allergy')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all allergies
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_allergies')

  // Get allergies
  let query = serviceClient
    .from('user_allergies')
    .select('*')
    .eq('user_id', patientId)
    .order('created_at', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const allergyIds = sharedResources
      .filter(r => r.resource_type === 'allergy' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (allergyIds.length === 0) return []
    query = query.in('id', allergyIds)
  }

  const { data } = await query
  return data || []
}

/**
 * Get patient's shared vaccines for current doctor
 */
export async function getDoctorAccessibleVaccines(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to vaccines
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_vaccines,resource_type.eq.vaccine')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all vaccines
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_vaccines')

  // Get vaccines
  let query = serviceClient
    .from('vaccinations')
    .select('*')
    .eq('user_id', patientId)
    .order('administration_date', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const vaccineIds = sharedResources
      .filter(r => r.resource_type === 'vaccine' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (vaccineIds.length === 0) return []
    query = query.in('id', vaccineIds)
  }

  const { data } = await query
  return data || []
}

/**
 * Get patient's shared antecedentes for current doctor
 */
export async function getDoctorAccessibleAntecedentes(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to antecedentes
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_antecedentes,resource_type.eq.antecedente')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all antecedentes
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_antecedentes')

  // Get both personal and family history
  if (hasAllAccess) {
    // Has access to all, fetch everything
    const [{ data: personalData }, { data: familyData }] = await Promise.all([
      serviceClient
        .from('user_personal_history')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false }),
      serviceClient
        .from('user_family_history')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
    ])
    
    return [...(personalData || []), ...(familyData || [])]
  } else {
    // Specific access only
    const antecedenteIds = sharedResources
      .filter(r => r.resource_type === 'antecedente' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (antecedenteIds.length === 0) return []
    
    // Try to get from both tables with specific IDs
    const [{ data: personalData }, { data: familyData }] = await Promise.all([
      serviceClient
        .from('user_personal_history')
        .select('*')
        .eq('user_id', patientId)
        .in('id', antecedenteIds),
      serviceClient
        .from('user_family_history')
        .select('*')
        .eq('user_id', patientId)
        .in('id', antecedenteIds)
    ])
    
    return [...(personalData || []), ...(familyData || [])]
  }
}

/**
 * Get patient's shared reports for current doctor
 */
export async function getDoctorAccessibleReports(patientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const serviceClient = createServiceClient()
  
  // Get doctor profile
  const { data: doctorProfile } = await serviceClient
    .from('doctor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctorProfile) return []

  // Check if doctor has access to reports
  const { data: sharedResources } = await serviceClient
    .from('shared_resources_with_doctor')
    .select('resource_type, resource_id')
    .eq('doctor_id', doctorProfile.id)
    .eq('patient_id', patientId)
    .or('resource_type.eq.all_reports,resource_type.eq.report')

  if (!sharedResources || sharedResources.length === 0) return []

  // Check if has access to all reports
  const hasAllAccess = sharedResources.some(r => r.resource_type === 'all_reports')

  // Get reports
  let query = serviceClient
    .from('reports')
    .select('*')
    .eq('user_id', patientId)
    .order('created_at', { ascending: false })

  // If not all access, filter by specific IDs
  if (!hasAllAccess) {
    const reportIds = sharedResources
      .filter(r => r.resource_type === 'report' && r.resource_id)
      .map(r => r.resource_id!)
    
    if (reportIds.length === 0) return []
    query = query.in('id', reportIds)
  }

  const { data } = await query
  return data || []
}
