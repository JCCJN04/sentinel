// lib/share-service.ts
import { supabaseBrowserClient as supabase } from "./supabase"; // O tu cliente Supabase configurado
import { documentService, type ShareOptions as DocumentServiceShareOptions } from "./document-service";

// Esta es la interfaz que tu página (page.tsx) usará para pasar opciones al servicio
export interface ShareServiceOptions {
  documentId: string;
  accessDuration?: "1day" | "7days" | "30days" | "unlimited";
  permissions: {
    view: boolean;
    download: boolean;
    print: boolean;
    edit: boolean;
  };
  password?: string;
  // Específico para el método de email
  emails?: string[];
  message?: string;
  // Para el método de enlace/QR, si se quiere un ID personalizado o un placeholder
  customShareIdentifier?: string; 
}

export interface ShareResult {
  success: boolean;
  shareLink?: string;     // URL completa para compartir
  qrCodeData?: string;    // Datos para el QR (usualmente es el shareLink)
  shareRecordId?: string; // ID del registro creado en la tabla document_shares
  error?: string;
}

function mapAccessDurationToExpiryDate(duration?: "1day" | "7days" | "30days" | "unlimited"): string | undefined {
  if (!duration || duration === "unlimited") {
    return undefined;
  }
  const now = new Date();
  switch (duration) {
    case "1day":
      now.setDate(now.getDate() + 1);
      break;
    case "7days":
      now.setDate(now.getDate() + 7);
      break;
    case "30days":
      now.setDate(now.getDate() + 30);
      break;
    default:
      return undefined;
  }
  return now.toISOString();
}

// Función interna para crear el registro de compartición y el enlace
async function createShareAndGetLink(
  documentId: string,
  method: "link" | "email" | "qr",
  options: ShareServiceOptions,
  specificSharedWith?: string // Para email, este será el correo del destinatario
): Promise<{ shareRecordId?: string; link?: string; error?: string }> {
  
  const dsShareOptions: DocumentServiceShareOptions = {
    sharedWith: specificSharedWith || options.customShareIdentifier || `link_share_${crypto.randomUUID().substring(0,8)}`,
    expiryDate: mapAccessDurationToExpiryDate(options.accessDuration),
    permissions: options.permissions,
    method: method,
    password: options.password,
  };

  try {
    const shareRecord = await documentService.shareDocument(documentId, dsShareOptions);
    if (shareRecord && shareRecord.id) {
      const shareableLink = `${window.location.origin}/public/shared-document/${shareRecord.id}`;
      return { shareRecordId: shareRecord.id, link: shareableLink };
    } else {
      return { error: "No se pudo crear el registro de compartición en la base de datos." };
    }
  } catch (error: any) {
    console.error(`Error creating share record for method ${method}:`, error);
    return { error: error.message || `Error al crear compartición (${method}).` };
  }
}

const generateShareLink = async (options: ShareServiceOptions): Promise<ShareResult> => {
  const { documentId } = options;
  const result = await createShareAndGetLink(documentId, "link", options);

  if (result.link && result.shareRecordId) {
    return { success: true, shareLink: result.link, shareRecordId: result.shareRecordId };
  }
  return { success: false, error: result.error || "No se pudo generar el enlace de compartición." };
};

const generateQRCode = async (options: ShareServiceOptions): Promise<ShareResult> => {
  const { documentId } = options;
  // El QR simplemente codificará el enlace compartible
  const result = await createShareAndGetLink(documentId, "qr", options); // Usa "qr" como método para el registro

  if (result.link && result.shareRecordId) {
    return { success: true, qrCodeData: result.link, shareLink: result.link, shareRecordId: result.shareRecordId };
  }
  return { success: false, error: result.error || "No se pudieron generar los datos para el código QR." };
};

const shareViaEmail = async (options: ShareServiceOptions): Promise<ShareResult> => {
  const { documentId, emails, message } = options;

  if (!emails || emails.length === 0) {
    return { success: false, error: "No se proporcionaron direcciones de correo electrónico." };
  }

  let overallSuccess = true;
  let errors: string[] = [];
  let firstSuccessfulLink: string | undefined;
  let firstSuccessfulRecordId: string | undefined;

  for (const email of emails) {
    const result = await createShareAndGetLink(documentId, "email", options, email);
    if (result.link && result.shareRecordId) {
      if (!firstSuccessfulLink) {
        firstSuccessfulLink = result.link;
        firstSuccessfulRecordId = result.shareRecordId;
      }
      // Aquí es donde llamarías a tu Supabase Edge Function para enviar el correo
      console.log(`TODO: Enviar correo a ${email} con enlace: ${result.link} y mensaje: "${message || ''}"`);
      try {
        // Ejemplo de llamada a una Edge Function (necesitarías crear esta función)
        // const { error: emailError } = await supabase.functions.invoke('send-share-email', {
        //   body: {
        //     to: email,
        //     shareLink: result.link,
        //     documentName: "Nombre del Documento (obtenerlo)", // Deberías pasar el nombre del documento
        //     customMessage: message || ''
        //   }
        // });
        // if (emailError) throw emailError;
        console.log(`Simulando envío de email a ${email} con enlace ${result.link}`);
      } catch (emailError: any) {
        console.error(`Error al intentar enviar email a ${email}:`, emailError);
        errors.push(`Fallo al enviar a ${email}: ${emailError.message}`);
        overallSuccess = false;
      }
    } else {
      errors.push(`Fallo al crear compartición para ${email}: ${result.error}`);
      overallSuccess = false;
    }
  }

  if (overallSuccess && errors.length === 0) {
    return { success: true, shareLink: firstSuccessfulLink, shareRecordId: firstSuccessfulRecordId };
  } else {
    return { 
      success: errors.length < emails.length, // Considera éxito parcial si algunos correos funcionaron
      error: errors.join("; ") || "Errores desconocidos al compartir por email.",
      shareLink: firstSuccessfulLink, // Devuelve el primer enlace exitoso, si alguno
      shareRecordId: firstSuccessfulRecordId 
    };
  }
};

export const shareService = {
  generateShareLink,
  generateQRCode,
  shareViaEmail,
};