import {
  type Consultation,
  type ConsultationImage,
  type CreateConsultationInput,
  type CreatePrescriptionInput,
  type DoctorRepo,
  type Prescription,
} from "./doctor.repo";
import { consultations, patients, prescriptions, sharedDocuments } from "./doctor.mock";

const generateId = (prefix: string) => {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${random}`;
};

export const doctorRepo: DoctorRepo = {
  async listPatients() {
    return patients.map((patient) => ({ ...patient }));
  },

  async getPatient(patientId) {
    const patient = patients.find((item) => item.id === patientId);
    return patient ? { ...patient } : null;
  },

  async listSharedDocuments() {
    return sharedDocuments
      .map((doc) => ({ ...doc }))
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  },

  async listPrescriptions(patientId) {
    const items = patientId
      ? prescriptions.filter((item) => item.patientId === patientId)
      : prescriptions;

    return items
      .map((item) => ({ ...item }))
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  },

  async createPrescription(input: CreatePrescriptionInput) {
    const newPrescription: Prescription = {
      id: generateId("prescription"),
      ...input,
    };

    prescriptions.unshift(newPrescription);

    return { ...newPrescription };
  },

  async listConsultations(patientId) {
    const items = patientId
      ? consultations.filter((item) => item.patientId === patientId)
      : consultations;

    return items
      .map((item) => ({ ...item, attachments: item.attachments.map(cloneAttachment) }))
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
  },

  async getConsultation(consultationId) {
    const consultation = consultations.find((item) => item.id === consultationId);
    return consultation
      ? {
          ...consultation,
          attachments: consultation.attachments.map(cloneAttachment),
        }
      : null;
  },

  async createConsultation(input: CreateConsultationInput) {
    const newConsultation: Consultation = {
      id: generateId("consultation"),
      attachments: input.attachments?.map(cloneAttachment) ?? [],
      status: input.status ?? "scheduled",
      ...input,
    };

    consultations.unshift(newConsultation);

    return {
      ...newConsultation,
      attachments: newConsultation.attachments.map(cloneAttachment),
    };
  },
};

function cloneAttachment(attachment: ConsultationImage): ConsultationImage {
  return { ...attachment };
}
