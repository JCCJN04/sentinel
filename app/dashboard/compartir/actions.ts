"use server"

import { revalidatePath } from "next/cache"
import { 
  shareResourceWithDoctor, 
  revokeSharedResource,
  revokeAllResourcesOfType,
  type ResourceType 
} from "@/lib/shared-resources-service"

export async function shareResourceAction(
  doctorId: string,
  resourceType: ResourceType,
  resourceId?: string | null,
  expiresAt?: string | null,
  notes?: string | null
) {
  try {
    await shareResourceWithDoctor({
      doctor_id: doctorId,
      resource_type: resourceType,
      resource_id: resourceId,
      expires_at: expiresAt,
      notes: notes
    })
    
    revalidatePath('/dashboard/doctores')
    revalidatePath('/dashboard/compartir')
    
    return { success: true }
  } catch (error) {
    console.error('Error sharing resource:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to share resource' 
    }
  }
}

export async function revokeResourceAction(shareId: string) {
  try {
    await revokeSharedResource(shareId)
    
    revalidatePath('/dashboard/doctores')
    revalidatePath('/dashboard/compartir')
    
    return { success: true }
  } catch (error) {
    console.error('Error revoking resource:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to revoke resource' 
    }
  }
}

export async function revokeAllResourcesAction(
  doctorId: string,
  resourceType: ResourceType
) {
  try {
    await revokeAllResourcesOfType(doctorId, resourceType)
    
    revalidatePath('/dashboard/doctores')
    revalidatePath('/dashboard/compartir')
    
    return { success: true }
  } catch (error) {
    console.error('Error revoking resources:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to revoke resources' 
    }
  }
}
