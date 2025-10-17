// lib/share-service.ts
import { supabaseBrowserClient as supabase } from "./supabase";
import { type Document } from './document-service';

export interface SharedLink {
  id: string;
  document_id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  can_download: boolean; // NUEVO: Permiso de descarga
}

export interface SharedDocumentResponse {
    document: Document;
    shareDetails: SharedLink;
}

/**
 * Crea un enlace para compartir para un documento con una duración y permisos específicos.
 * @param documentId El ID del documento a compartir.
 * @param duration La cantidad de tiempo.
 * @param unit La unidad de tiempo.
 * @param canDownload Si el destinatario puede descargar el archivo.
 * @returns El objeto del enlace compartido o un error.
 */
export async function createShareLink(
  documentId: string, 
  duration: number, 
  unit: 'hour' | 'hours' | 'days', 
  canDownload: boolean // NUEVO: Parámetro de permiso
): Promise<{ link: SharedLink | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { link: null, error: 'Usuario no autenticado.' };
  }

  const expiresAt = new Date();
  switch (unit) {
    case 'hour':
    case 'hours':
      expiresAt.setHours(expiresAt.getHours() + duration);
      break;
    case 'days':
      expiresAt.setDate(expiresAt.getDate() + duration);
      break;
  }
  
  const { data, error } = await supabase
    .from('shared_links')
    .insert({
      document_id: documentId,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
      can_download: canDownload, // NUEVO: Guardar el permiso
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating share link:', error);
    return { link: null, error: 'No se pudo crear el enlace en la base de datos.' };
  }

  return { link: data, error: null };
}

/**
 * Obtiene un documento compartido por su ID de enlace (token).
 * Valida que el enlace no haya expirado.
 * @param linkId El ID del enlace (token) de la URL.
 * @returns Los detalles del documento y del enlace, o un error.
 */
export async function getSharedDocumentByLinkId(linkId: string): Promise<{ data: SharedDocumentResponse | null; error: string | null }> {
  const { data: linkData, error: linkError } = await supabase
    .from('shared_links')
    .select('*')
    .eq('id', linkId)
    .single();

  if (linkError || !linkData) {
    return { data: null, error: 'Enlace no válido o no encontrado.' };
  }

  if (new Date(linkData.expires_at) < new Date()) {
    return { data: null, error: 'Este enlace para compartir ha expirado.' };
  }

  const { data: documentData, error: documentError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', linkData.document_id)
    .single();

  if (documentError || !documentData) {
    return { data: null, error: 'El documento asociado a este enlace ya no existe.' };
  }

  return {
    data: {
      document: documentData as Document,
      shareDetails: linkData as SharedLink,
    },
    error: null,
  };
}