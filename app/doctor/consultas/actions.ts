"use server"

import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import type { CreateConsultationInput, Consultation } from "@/lib/data/doctor.repo"

export async function createMockConsultation(input: CreateConsultationInput): Promise<Consultation> {
  const payload: CreateConsultationInput = {
    ...input,
    status: input.status ?? "scheduled",
    notes: input.notes?.trim() || undefined,
  }

  return doctorRepo.createConsultation(payload)
}
