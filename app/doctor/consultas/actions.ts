"use server"

import { createConsultation, getCurrentDoctorProfile } from "@/lib/doctor-service"
import type { CreateConsultationInput as DoctorServiceInput } from "@/types/doctor"

export async function createDoctorConsultation(input: {
  patientId: string
  scheduledAt: string
  reason: string
  notes?: string
  status?: string
}) {
  const doctorProfile = await getCurrentDoctorProfile()
  
  const payload: DoctorServiceInput = {
    doctor_id: doctorProfile.id,
    patient_id: input.patientId,
    scheduled_at: input.scheduledAt,
    reason: input.reason,
    status: (input.status as any) || "scheduled",
    notes: input.notes?.trim() || undefined,
  }

  return createConsultation(payload)
}
