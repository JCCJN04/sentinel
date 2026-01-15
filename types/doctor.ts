// Types for Doctor Module
// Generated from Supabase schema

export type DoctorProfile = {
  id: string;
  user_id: string;
  professional_id: string | null;
  specialty: string;
  subspecialties: string[] | null;
  phone_number: string | null;
  office_address: string | null;
  consultation_hours: Record<string, string[]> | null;
  bio: string | null;
  years_experience: number | null;
  languages: string[];
  consultation_duration_minutes: number;
  accepts_new_patients: boolean;
  consultation_fee: number | null;
  created_at: string;
  updated_at: string;
};

export type DoctorPatient = {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient_notes: string | null;
  first_consultation_date: string | null;
  last_consultation_date: string | null;
  total_consultations: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
};

export type ConsultationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type Consultation = {
  id: string;
  doctor_id: string;
  patient_id: string;
  doctor_patient_id: string | null;
  scheduled_at: string;
  completed_at: string | null;
  duration_minutes: number;
  reason: string;
  symptoms: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  notes: string | null;
  status: ConsultationStatus;
  cancellation_reason: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsultationAttachment = {
  id: string;
  consultation_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type DoctorPrescription = {
  id: string;
  doctor_id: string;
  patient_id: string;
  consultation_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SharedDocumentWithDoctor = {
  id: string;
  document_id: string;
  patient_id: string;
  doctor_id: string;
  can_view: boolean;
  can_download: boolean;
  shared_at: string;
  last_viewed_at: string | null;
  view_count: number;
  notes: string | null;
};

export type DoctorAvailability = {
  id: string;
  doctor_id: string;
  date: string;
  is_available: boolean;
  time_slots: { start: string; end: string }[] | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

// Input types for creating/updating records
export type CreateDoctorProfileInput = Omit<
  DoctorProfile,
  'id' | 'created_at' | 'updated_at' | 'languages' | 'consultation_duration_minutes' | 'accepts_new_patients'
> & {
  languages?: string[];
  consultation_duration_minutes?: number;
  accepts_new_patients?: boolean;
};

export type UpdateDoctorProfileInput = Partial<
  Omit<DoctorProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type CreateConsultationInput = Omit<
  Consultation,
  'id' | 'created_at' | 'updated_at' | 'doctor_patient_id' | 'completed_at' | 'status' | 'duration_minutes' | 'follow_up_required'
> & {
  status?: ConsultationStatus;
  duration_minutes?: number;
  follow_up_required?: boolean;
};

export type UpdateConsultationInput = Partial<
  Omit<Consultation, 'id' | 'doctor_id' | 'patient_id' | 'created_at' | 'updated_at'>
>;

export type CreateDoctorPrescriptionInput = Omit<
  DoctorPrescription,
  'id' | 'created_at' | 'updated_at'
>;

export type CreateSharedDocumentInput = Omit<
  SharedDocumentWithDoctor,
  'id' | 'shared_at' | 'last_viewed_at' | 'view_count' | 'can_view'
> & {
  can_view?: boolean;
};

export type CreateConsultationAttachmentInput = Omit<
  ConsultationAttachment,
  'id' | 'created_at'
>;

export type CreateDoctorAvailabilityInput = Omit<
  DoctorAvailability,
  'id' | 'created_at' | 'updated_at' | 'is_available'
> & {
  is_available?: boolean;
};

// Extended types with relations
export type ConsultationWithRelations = Consultation & {
  attachments?: ConsultationAttachment[];
  doctor?: DoctorProfile;
  patient?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
};

export type DoctorPatientWithProfile = DoctorPatient & {
  patient?: {
    id: string;
    full_name: string | null;
    email: string | null;
    date_of_birth: string | null;
    sex: string | null;
  };
};

export type DoctorPrescriptionWithRelations = DoctorPrescription & {
  doctor?: DoctorProfile;
  patient?: {
    id: string;
    full_name: string | null;
  };
  consultation?: Consultation;
};
