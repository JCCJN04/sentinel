// lib/actions/share.actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Document } from "../document-service";
import { SharedLink } from "../share-service";

export interface PublicSharedDocumentResponse {
  document: Document;
  shareDetails: SharedLink;
  fileUrl: string;
}

/**
 * Verifica el token de acceso y, si es válido, obtiene los datos del documento compartido.
 * @param linkId El ID del enlace compartido.
 * @param accessToken El token de 6 dígitos proporcionado por el usuario.
 * @returns Los datos del documento o un objeto de error.
 */
export async function verifyTokenAndGetDocument(
  linkId: string,
  accessToken: string
): Promise<{ data: PublicSharedDocumentResponse | null; error: string | null }> {
  const cookieStore = cookies();
  
  // Creamos un cliente de Supabase para el servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // 1. Obtener el enlace y validar el token
  const { data: linkData, error: linkError } = await supabase
    .from("shared_links")
    .select("*")
    .eq("id", linkId)
    .eq("access_token", accessToken) // NUEVO: Validar el token en la consulta
    .single();

  if (linkError || !linkData) {
    // Si no se encuentra, puede ser por ID incorrecto o token incorrecto.
    // Damos un mensaje genérico por seguridad.
    return { data: null, error: "Token de acceso no válido o el enlace no existe." };
  }

  // 2. Validar que el enlace no haya expirado
  if (new Date(linkData.expires_at) < new Date()) {
    return { data: null, error: "Este enlace para compartir ha expirado." };
  }

  // 3. Obtener el documento usando el cliente con privilegios (service_role)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll() },
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  const { data: documentData, error: documentError } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", linkData.document_id)
    .single();

  if (documentError || !documentData) {
    return { data: null, error: "El documento asociado ya no existe." };
  }

  // 4. Generar la URL segura para el archivo
  const { data: urlData, error: urlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(documentData.file_path, 300);

  if (urlError || !urlData) {
    return { data: null, error: "No se pudo generar la URL para el archivo." };
  }

  // 5. Devolver los datos
  return {
    data: {
      document: documentData as Document,
      shareDetails: linkData as SharedLink,
      fileUrl: urlData.signedUrl,
    },
    error: null,
  };
}