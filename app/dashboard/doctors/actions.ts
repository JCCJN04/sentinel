"use server"

import { revokePatientDoctorAccess } from "@/lib/patient-doctors-service"
import { revalidatePath } from "next/cache"

export async function revokeDoctorAccessAction(doctorRelationId: string) {
  try {
    await revokePatientDoctorAccess(doctorRelationId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error revoking doctor access:', error)
    return { error: error.message || 'No se pudo revocar el acceso' }
  }
}
