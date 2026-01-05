"use server"

import { doctorRepo } from "@/lib/data/doctor.repo.mock"
import type { CreatePrescriptionInput, Prescription } from "@/lib/data/doctor.repo"

export async function createMockPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
  const payload = {
    ...input,
    notes: input.notes?.trim() || undefined,
  }

  return doctorRepo.createPrescription(payload)
}
