"use server"

import { acceptInvitation, rejectInvitation } from "@/lib/invitation-service"
import { revalidatePath } from "next/cache"

export async function acceptInvitationAction(invitationId: string) {
  try {
    await acceptInvitation(invitationId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return { error: error.message || 'No se pudo aceptar la invitación' }
  }
}

export async function rejectInvitationAction(invitationId: string) {
  try {
    await rejectInvitation(invitationId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting invitation:', error)
    return { error: error.message || 'No se pudo rechazar la invitación' }
  }
}
