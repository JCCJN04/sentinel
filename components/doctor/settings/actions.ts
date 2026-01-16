"use server"

import { updateDoctorProfile } from "@/lib/doctor-service"
import type { UpdateDoctorProfileInput } from "@/types/doctor"
import { revalidatePath } from "next/cache"

export async function updateDoctorProfileAction(
  doctorId: string,
  data: UpdateDoctorProfileInput
) {
  try {
    await updateDoctorProfile(doctorId, data)
    revalidatePath("/doctor/configuracion")
    return { success: true }
  } catch (error) {
    console.error("Error updating doctor profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
