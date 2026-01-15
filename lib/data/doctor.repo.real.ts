import { createClient } from '@/lib/supabase/server';
import type {
  Consultation,
  CreateConsultationInput,
  CreatePrescriptionInput,
  DoctorRepo,
  Patient,
  Prescription,
  SharedDocument,
} from './doctor.repo';
import {
  getCurrentDoctorProfile,
  getDoctorPatients,
  getConsultations,
  getConsultation,
  createConsultation,
  getDoctorPrescriptions,
  createDoctorPrescription,
  getSharedDocumentsWithDoctor,
} from '@/lib/doctor-service';

/**
 * Implementación real del repositorio de doctores usando Supabase
 * Reemplaza el mock con datos reales de la base de datos
 */
export const doctorRepoReal: DoctorRepo = {
  async listPatients() {
    try {
      const doctorProfile = await getCurrentDoctorProfile();
      const patients = await getDoctorPatients(doctorProfile.id);

      return patients.map((p: any) => ({
        id: p.patient_id,
        name: p.patient?.profiles?.full_name || 'Sin nombre',
        age: calculateAge(p.patient?.profiles?.date_of_birth),
        sex: mapSex(p.patient?.profiles?.sex),
        lastVisit: p.last_consultation_date || p.created_at,
        conditions: [], // TODO: Obtener de user_personal_history
      }));
    } catch (error) {
      console.error('Error listing patients:', error);
      return [];
    }
  },

  async getPatient(patientId: string) {
    try {
      const supabase = await createClient();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (!profile) return null;

      const doctorProfile = await getCurrentDoctorProfile();
      const { data: relationship } = await supabase
        .from('doctor_patients')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .eq('patient_id', patientId)
        .single();

      // Get medical conditions
      const { data: conditions } = await supabase
        .from('user_personal_history')
        .select('condition_name')
        .eq('user_id', patientId);

      return {
        id: profile.id,
        name: profile.full_name || 'Sin nombre',
        age: calculateAge(profile.date_of_birth),
        sex: mapSex(profile.sex),
        lastVisit: relationship?.last_consultation_date || relationship?.created_at || '',
        conditions: conditions?.map((c) => c.condition_name) || [],
      };
    } catch (error) {
      console.error('Error getting patient:', error);
      return null;
    }
  },

  async listSharedDocuments() {
    try {
      const doctorProfile = await getCurrentDoctorProfile();
      const documents = await getSharedDocumentsWithDoctor(doctorProfile.id);

      return documents.map((doc: any) => ({
        id: doc.id,
        patientId: doc.patient_id,
        title: doc.document?.title || 'Sin título',
        category: doc.document?.category || 'General',
        uploadedAt: doc.shared_at,
        url: doc.document?.file_path || '',
      }));
    } catch (error) {
      console.error('Error listing shared documents:', error);
      return [];
    }
  },

  async listPrescriptions(patientId?: string) {
    try {
      const doctorProfile = await getCurrentDoctorProfile();
      const prescriptions = await getDoctorPrescriptions(doctorProfile.id, patientId);

      return prescriptions.map((p: any) => ({
        id: p.id,
        patientId: p.patient_id,
        medication: p.medication_name,
        dosage: p.dosage,
        frequency: p.frequency,
        startDate: p.start_date,
        endDate: p.end_date || '',
        notes: p.notes || p.instructions || '',
      }));
    } catch (error) {
      console.error('Error listing prescriptions:', error);
      return [];
    }
  },

  async createPrescription(input: CreatePrescriptionInput) {
    try {
      const doctorProfile = await getCurrentDoctorProfile();

      const prescription = await createDoctorPrescription({
        doctor_id: doctorProfile.id,
        patient_id: input.patientId,
        medication_name: input.medication,
        dosage: input.dosage,
        frequency: input.frequency,
        start_date: input.startDate,
        end_date: input.endDate || null,
        notes: input.notes || null,
        consultation_id: null,
        instructions: null,
        duration: null,
      });

      return {
        id: prescription.id,
        patientId: prescription.patient_id,
        medication: prescription.medication_name,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        startDate: prescription.start_date,
        endDate: prescription.end_date || '',
        notes: prescription.notes || '',
      };
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  },

  async listConsultations(patientId?: string) {
    try {
      const doctorProfile = await getCurrentDoctorProfile();
      const consultations = await getConsultations(doctorProfile.id, {
        patientId,
      });

      return consultations.map((c: any) => ({
        id: c.id,
        patientId: c.patient_id,
        scheduledAt: c.scheduled_at,
        reason: c.reason,
        status: c.status,
        notes: c.notes || '',
        attachments: (c.attachments || []).map((a: any) => ({
          id: a.id,
          consultationId: a.consultation_id,
          title: a.title,
          description: a.description || '',
          url: a.file_url,
          uploadedAt: a.created_at,
        })),
      }));
    } catch (error) {
      console.error('Error listing consultations:', error);
      return [];
    }
  },

  async getConsultation(consultationId: string) {
    try {
      const consultation = await getConsultation(consultationId);

      if (!consultation) return null;

      return {
        id: consultation.id,
        patientId: consultation.patient_id,
        scheduledAt: consultation.scheduled_at,
        reason: consultation.reason,
        status: consultation.status,
        notes: consultation.notes || '',
        attachments: (consultation.attachments || []).map((a: any) => ({
          id: a.id,
          consultationId: a.consultation_id,
          title: a.title,
          description: a.description || '',
          url: a.file_url,
          uploadedAt: a.created_at,
        })),
      };
    } catch (error) {
      console.error('Error getting consultation:', error);
      return null;
    }
  },

  async createConsultation(input: CreateConsultationInput) {
    try {
      const doctorProfile = await getCurrentDoctorProfile();

      const consultation = await createConsultation({
        doctor_id: doctorProfile.id,
        patient_id: input.patientId,
        scheduled_at: input.scheduledAt,
        reason: input.reason,
        status: input.status || 'scheduled',
        notes: input.notes || null,
        symptoms: null,
        diagnosis: null,
        treatment_plan: null,
        cancellation_reason: null,
        follow_up_date: null,
      });

      return {
        id: consultation.id,
        patientId: consultation.patient_id,
        scheduledAt: consultation.scheduled_at,
        reason: consultation.reason,
        status: consultation.status,
        notes: consultation.notes || '',
        attachments: input.attachments || [],
      };
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
  },
};

// Helper functions
function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function mapSex(sex: string | null): 'male' | 'female' | 'other' {
  if (!sex) return 'other';
  
  const normalized = sex.toLowerCase();
  if (normalized === 'male' || normalized === 'masculino' || normalized === 'm') {
    return 'male';
  }
  if (normalized === 'female' || normalized === 'femenino' || normalized === 'f') {
    return 'female';
  }
  return 'other';
}
