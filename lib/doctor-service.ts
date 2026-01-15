import { createClient } from '@/lib/supabase/server';
import type {
  DoctorProfile,
  DoctorPatient,
  Consultation,
  ConsultationAttachment,
  DoctorPrescription,
  SharedDocumentWithDoctor,
  DoctorAvailability,
  CreateDoctorProfileInput,
  UpdateDoctorProfileInput,
  CreateConsultationInput,
  UpdateConsultationInput,
  CreateDoctorPrescriptionInput,
  CreateSharedDocumentInput,
  CreateConsultationAttachmentInput,
  CreateDoctorAvailabilityInput,
  ConsultationWithRelations,
  DoctorPatientWithProfile,
} from '@/types/doctor';

// =====================================================
// DOCTOR PROFILES
// =====================================================

export async function getDoctorProfile(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data as DoctorProfile;
}

export async function getCurrentDoctorProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');
  
  return getDoctorProfile(user.id);
}

export async function createDoctorProfile(input: CreateDoctorProfileInput) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_profiles')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorProfile;
}

export async function updateDoctorProfile(
  doctorId: string,
  input: UpdateDoctorProfileInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_profiles')
    .update(input)
    .eq('id', doctorId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorProfile;
}

export async function isDoctorUser() {
  const supabase = await createClient();
  
  const { data } = await supabase.rpc('is_doctor');
  return data as boolean;
}

// =====================================================
// DOCTOR PATIENTS
// =====================================================

export async function getDoctorPatients(doctorId: string) {
  const supabase = await createClient();
  
  // First, get doctor_patients relationships
  const { data: relationships, error: relError } = await supabase
    .from('doctor_patients')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('status', 'active')
    .order('last_consultation_date', { ascending: false, nullsFirst: false });
  
  if (relError) throw relError;
  if (!relationships || relationships.length === 0) return [];
  
  // Then, get patient profiles
  const patientIds = relationships.map(r => r.patient_id);
  const { data: patients, error: patientsError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', patientIds);
  
  if (patientsError) throw patientsError;
  
  // Combine the data
  return relationships.map(rel => ({
    ...rel,
    patient: patients?.find(p => p.id === rel.patient_id) || null
  }));
}

export async function addPatientToDoctor(
  doctorId: string,
  patientId: string,
  notes?: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_patients')
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      patient_notes: notes,
    })
    .select()
    .single();
  
  if (error) {
    // Check if relationship already exists
    if (error.code === '23505') {
      // Update existing relationship
      const { data: updated, error: updateError } = await supabase
        .from('doctor_patients')
        .update({ status: 'active', patient_notes: notes })
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updated as DoctorPatient;
    }
    throw error;
  }
  
  return data as DoctorPatient;
}

export async function updatePatientNotes(
  doctorPatientId: string,
  notes: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_patients')
    .update({ patient_notes: notes })
    .eq('id', doctorPatientId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorPatient;
}

// =====================================================
// CONSULTATIONS
// =====================================================

export async function getConsultations(
  doctorId: string,
  filters?: {
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const supabase = await createClient();
  
  let query = supabase
    .from('consultations')
    .select('*, consultation_attachments(*)')
    .eq('doctor_id', doctorId)
    .order('scheduled_at', { ascending: false });
  
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.startDate) {
    query = query.gte('scheduled_at', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.lte('scheduled_at', filters.endDate);
  }
  
  const { data: consultations, error } = await query;
  
  if (error) throw error;
  if (!consultations || consultations.length === 0) return [];
  
  // Get unique patient and doctor IDs
  const patientIds = [...new Set(consultations.map(c => c.patient_id))];
  const doctorIds = [...new Set(consultations.map(c => c.doctor_id))];
  
  // Fetch profiles and doctor_profiles
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', [...patientIds, ...doctorIds]);
  const { data: doctorProfiles } = await supabase.from('doctor_profiles').select('*').in('id', doctorIds);
  
  // Combine data
  return consultations.map(c => ({
    ...c,
    patient: { id: c.patient_id, profiles: profiles?.find(p => p.id === c.patient_id) },
    doctor: { ...doctorProfiles?.find(d => d.id === c.doctor_id), profiles: profiles?.find(p => p.id === c.doctor_id) },
    attachments: c.consultation_attachments
  })) as ConsultationWithRelations[];
}

export async function getConsultation(consultationId: string) {
  const supabase = await createClient();
  
  const { data: consultation, error } = await supabase
    .from('consultations')
    .select('*, consultation_attachments(*)')
    .eq('id', consultationId)
    .single();
  
  if (error) throw error;
  if (!consultation) return null;
  
  // Fetch related data
  const { data: patientProfile } = await supabase.from('profiles').select('*').eq('id', consultation.patient_id).single();
  const { data: doctorProfile } = await supabase.from('doctor_profiles').select('*').eq('id', consultation.doctor_id).single();
  const { data: doctorUserProfile } = await supabase.from('profiles').select('*').eq('id', consultation.doctor_id).single();
  
  const data = {
    ...consultation,
    patient: { id: consultation.patient_id, profiles: patientProfile },
    doctor: { ...doctorProfile, profiles: doctorUserProfile },
    attachments: consultation.consultation_attachments
  };
  
  if (error) throw error;
  return data as ConsultationWithRelations;
}

export async function createConsultation(input: CreateConsultationInput) {
  const supabase = await createClient();
  
  // First, ensure doctor-patient relationship exists
  const { data: relationship } = await supabase
    .from('doctor_patients')
    .select('id')
    .eq('doctor_id', input.doctor_id)
    .eq('patient_id', input.patient_id)
    .single();
  
  const consultationData = {
    ...input,
    doctor_patient_id: relationship?.id || null,
  };
  
  const { data, error } = await supabase
    .from('consultations')
    .insert(consultationData)
    .select()
    .single();
  
  if (error) throw error;
  return data as Consultation;
}

export async function updateConsultation(
  consultationId: string,
  input: UpdateConsultationInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('consultations')
    .update(input)
    .eq('id', consultationId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Consultation;
}

export async function cancelConsultation(
  consultationId: string,
  reason: string
) {
  return updateConsultation(consultationId, {
    status: 'cancelled',
    cancellation_reason: reason,
  });
}

export async function completeConsultation(
  consultationId: string,
  data: {
    diagnosis?: string;
    treatment_plan?: string;
    notes?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
  }
) {
  return updateConsultation(consultationId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    ...data,
  });
}

// =====================================================
// CONSULTATION ATTACHMENTS
// =====================================================

export async function addConsultationAttachment(
  input: CreateConsultationAttachmentInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('consultation_attachments')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data as ConsultationAttachment;
}

export async function deleteConsultationAttachment(attachmentId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('consultation_attachments')
    .delete()
    .eq('id', attachmentId);
  
  if (error) throw error;
}

// =====================================================
// PRESCRIPTIONS
// =====================================================

export async function getDoctorPrescriptions(
  doctorId: string,
  patientId?: string
) {
  const supabase = await createClient();
  
  let query = supabase
    .from('doctor_prescriptions')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });
  
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data: prescriptions, error } = await query;
  
  if (error) throw error;
  if (!prescriptions || prescriptions.length === 0) return [];
  
  // Get unique patient IDs and consultation IDs
  const patientIds = [...new Set(prescriptions.map(p => p.patient_id))];
  const consultationIds = prescriptions.map(p => p.consultation_id).filter(Boolean);
  
  // Fetch related data
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', patientIds);
  const { data: consultations } = consultationIds.length > 0 
    ? await supabase.from('consultations').select('*').in('id', consultationIds)
    : { data: [] };
  
  // Combine data
  return prescriptions.map(p => ({
    ...p,
    patient: { id: p.patient_id, profiles: profiles?.find(pr => pr.id === p.patient_id) },
    consultation: consultations?.find(c => c.id === p.consultation_id) || null
  }));
}

export async function createDoctorPrescription(
  input: CreateDoctorPrescriptionInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_prescriptions')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorPrescription;
}

export async function updateDoctorPrescription(
  prescriptionId: string,
  input: Partial<CreateDoctorPrescriptionInput>
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_prescriptions')
    .update(input)
    .eq('id', prescriptionId)
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorPrescription;
}

// =====================================================
// SHARED DOCUMENTS
// =====================================================

export async function getSharedDocumentsWithDoctor(doctorId: string) {
  const supabase = await createClient();
  
  const { data: sharedDocs, error } = await supabase
    .from('shared_documents_with_doctor')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('shared_at', { ascending: false });
  
  if (error) throw error;
  if (!sharedDocs || sharedDocs.length === 0) return [];
  
  // Get unique patient IDs and document IDs
  const patientIds = [...new Set(sharedDocs.map(d => d.patient_id))];
  const documentIds = [...new Set(sharedDocs.map(d => d.document_id))];
  
  // Fetch related data
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', patientIds);
  const { data: documents } = await supabase.from('documents').select('id, title, category, file_path, uploaded_at').in('id', documentIds);
  
  // Combine data
  const data = sharedDocs.map(d => ({
    ...d,
    document: documents?.find(doc => doc.id === d.document_id) || null,
    patient: { id: d.patient_id, profiles: profiles?.find(p => p.id === d.patient_id) }
  }));
  
  if (error) throw error;
  return data;
}

export async function shareDocumentWithDoctor(
  input: CreateSharedDocumentInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('shared_documents_with_doctor')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data as SharedDocumentWithDoctor;
}

export async function revokeDocumentShare(shareId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('shared_documents_with_doctor')
    .delete()
    .eq('id', shareId);
  
  if (error) throw error;
}

// =====================================================
// AVAILABILITY
// =====================================================

export async function getDoctorAvailability(
  doctorId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();
  
  let query = supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('date', { ascending: true });
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as DoctorAvailability[];
}

export async function setDoctorAvailability(
  input: CreateDoctorAvailabilityInput
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('doctor_availability')
    .upsert(input, {
      onConflict: 'doctor_id,date',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DoctorAvailability;
}

export async function deleteDoctorAvailability(availabilityId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('doctor_availability')
    .delete()
    .eq('id', availabilityId);
  
  if (error) throw error;
}

// =====================================================
// STATISTICS & ANALYTICS
// =====================================================

export async function getDoctorStats(doctorId: string) {
  const supabase = await createClient();
  
  // Get total patients
  const { count: totalPatients } = await supabase
    .from('doctor_patients')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'active');
  
  // Get consultations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count: consultationsThisMonth } = await supabase
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .gte('scheduled_at', startOfMonth.toISOString());
  
  // Get pending consultations
  const { count: pendingConsultations } = await supabase
    .from('consultations')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString());
  
  // Get active prescriptions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: activePrescriptions } = await supabase
    .from('doctor_prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  return {
    totalPatients: totalPatients || 0,
    consultationsThisMonth: consultationsThisMonth || 0,
    pendingConsultations: pendingConsultations || 0,
    activePrescriptions: activePrescriptions || 0,
  };
}
