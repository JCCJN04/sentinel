"use server"

import { createDoctorPrescription, getCurrentDoctorProfile } from "@/lib/doctor-service"
import type { CreateDoctorPrescriptionInput } from "@/types/doctor"

export async function createPrescriptionAction(input: {
  patientId: string
  medicationName: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  notes?: string
}) {
  const doctorProfile = await getCurrentDoctorProfile()
  
  const payload: CreateDoctorPrescriptionInput = {
    doctor_id: doctorProfile.id,
    patient_id: input.patientId,
    consultation_id: null,
    medication_name: input.medicationName,
    dosage: input.dosage,
    frequency: input.frequency,
    duration: null,
    start_date: input.startDate,
    end_date: input.endDate || null,
    instructions: null,
    notes: input.notes?.trim() || null,
  }

  return createDoctorPrescription(payload)
}
