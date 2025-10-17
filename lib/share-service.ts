// lib/share-service.ts
import { supabaseBrowserClient as supabase } from "./supabase";
import { type Document } from './document-service';

export interface SharedLink {
  id: string;
  document_id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  can_download: boolean;
  access_token: string; // NUEVO: Token de acceso
}

export interface CreateShareLinkResponse {
    link: SharedLink | null;
    error: string | null;
}

/**
 * Genera un token numérico aleatorio de 6 dígitos.
 */
function generateSixDigitToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Crea un enlace para compartir para un documento con duración, permisos y un token de acceso.
 * @returns El objeto del enlace compartido (incluyendo el token) o un error.
 */
export async function createShareLink(
  documentId: string, 
  duration: number, 
  unit: 'hour' | 'hours' | 'days', 
  canDownload: boolean
): Promise<CreateShareLinkResponse> {
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
  
  const accessToken = generateSixDigitToken();

  const { data, error } = await supabase
    .from('shared_links')
    .insert({
      document_id: documentId,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
      can_download: canDownload,
      access_token: accessToken, // NUEVO: Guardar el token
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating share link:', error);
    return { link: null, error: 'No se pudo crear el enlace en la base de datos.' };
  }

  return { link: data, error: null };
}