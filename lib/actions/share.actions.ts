// lib/actions/share.actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Document } from "../document-service";
import { SharedLink } from "../share-service";

// Interfaz para la respuesta que enviaremos al cliente
export interface PublicSharedDocumentResponse {
  document: Document;
  shareDetails: SharedLink;
  fileUrl: string;
}

/**
 * Esta es una Server Action que se ejecuta de forma segura en el servidor.
 * Utiliza una conexión privilegiada a Supabase para obtener un documento
 * que ha sido compartido, saltándose las políticas de RLS.
 * @param linkId El ID del enlace compartido.
 * @returns Los datos del documento o un objeto de error.
 */
export async function getPublicSharedDocument(
  linkId: string
): Promise<{ data: PublicSharedDocumentResponse | null; error: string | null }> {
  const cookieStore = cookies();

  // Creamos un cliente de Supabase especial para el servidor.
  // Es importante notar que no estamos usando el service_role aquí directamente,
  // sino que vamos a crear un cliente temporal que sí lo haga para una sola tarea.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // 1. Obtener el enlace compartido
  const { data: linkData, error: linkError } = await supabase
    .from("shared_links")
    .select("*")
    .eq("id", linkId)
    .single();

  if (linkError || !linkData) {
    return { data: null, error: "Enlace no válido o no encontrado." };
  }

  // 2. Validar que el enlace no haya expirado
  if (new Date(linkData.expires_at) < new Date()) {
    return { data: null, error: "Este enlace para compartir ha expirado." };
  }

  // 3. OBTENER EL DOCUMENTO USANDO UN CLIENTE CON PRIVILEGIOS (SERVICE ROLE)
  // Esto es necesario para saltarse la política de RLS de la tabla 'documents'.
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usamos la llave secreta
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
      auth: {
        // Le decimos que no intente auto-detectar la sesión del usuario
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );

  const { data: documentData, error: documentError } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", linkData.document_id)
    .single();

  if (documentError || !documentData) {
    return { data: null, error: "El documento asociado a este enlace ya no existe." };
  }

  // 4. Generar la URL segura para visualizar el archivo
  const { data: urlData, error: urlError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUrl(documentData.file_path, 300); // Expira en 5 minutos

  if (urlError || !urlData) {
    return { data: null, error: "No se pudo generar la URL para el archivo." };
  }

  // 5. Devolver todos los datos al componente cliente
  return {
    data: {
      document: documentData as Document,
      shareDetails: linkData as SharedLink,
      fileUrl: urlData.signedUrl,
    },
    error: null,
  };
}