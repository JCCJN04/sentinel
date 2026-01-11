export type Sex = "male" | "female" | "other";

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  lastVisit: string; // ISO date string
  conditions: string[];
};

export type SharedDocument = {
  id: string;
  patientId: string;
  title: string;
  category: string;
  uploadedAt: string; // ISO date string
  url: string;
};

export type Prescription = {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  notes?: string;
};

export type CreatePrescriptionInput = {
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

export type ConsultationStatus = "scheduled" | "completed" | "cancelled";

export type ConsultationImage = {
  id: string;
  consultationId: string;
  title: string;
  description?: string;
  url: string;
  uploadedAt: string; // ISO date string
};

export type Consultation = {
  id: string;
  patientId: string;
  scheduledAt: string; // ISO date string
  reason: string;
  status: ConsultationStatus;
  notes?: string;
  attachments: ConsultationImage[];
};

export type CreateConsultationInput = {
  patientId: string;
  scheduledAt: string;
  reason: string;
  status?: ConsultationStatus;
  notes?: string;
  attachments?: ConsultationImage[];
};

export type DoctorRepo = {
  listPatients: () => Promise<Patient[]>;
  getPatient: (patientId: string) => Promise<Patient | null>;
  listSharedDocuments: () => Promise<SharedDocument[]>;
  listPrescriptions: (patientId?: string) => Promise<Prescription[]>;
  createPrescription: (input: CreatePrescriptionInput) => Promise<Prescription>;
  listConsultations: (patientId?: string) => Promise<Consultation[]>;
  getConsultation: (consultationId: string) => Promise<Consultation | null>;
  createConsultation: (input: CreateConsultationInput) => Promise<Consultation>;
};
