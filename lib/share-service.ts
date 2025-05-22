import { supabaseBrowserClient as supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid"

export interface ShareOptions {
  documentId: string
  accessDuration: "1day" | "7days" | "30days" | "unlimited"
  permissions: {
    view: boolean
    download: boolean
    print: boolean
    edit: boolean
  }
  password?: string
  emails?: string[]
  message?: string
}

export interface ShareResult {
  success: boolean
  shareId?: string
  shareLink?: string
  qrCodeData?: string
  error?: string
}

// Función auxiliar para crear la tabla si no existe
const ensureDocumentSharesTable = async () => {
  try {
    // Verificar si la tabla existe
    const { data, error } = await supabase.from("document_shares").select("id").limit(1)

    if (error && error.code === "42P01") {
      // Código de error para "relation does not exist"
      // La tabla no existe, vamos a crearla
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS document_shares (
          id UUID PRIMARY KEY,
          document_id UUID NOT NULL,
          user_id UUID NOT NULL,
          share_type TEXT NOT NULL DEFAULT 'link',
          expires_at TIMESTAMP WITH TIME ZONE,
          permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false, "print": false, "edit": false}',
          password TEXT,
          recipients TEXT[],
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own shares"
        ON document_shares FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own shares"
        ON document_shares FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own shares"
        ON document_shares FOR UPDATE
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own shares"
        ON document_shares FOR DELETE
        USING (auth.uid() = user_id);
      `

      await supabase.rpc("run_sql", { query: createTableQuery })
    }
  } catch (error) {
    console.error("Error checking/creating document_shares table:", error)
  }
}

export const shareService = {
  async generateShareLink(options: ShareOptions): Promise<ShareResult> {
    try {
      // Asegurarnos de que la tabla existe
      await ensureDocumentSharesTable()

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error al obtener usuario:", userError)
        return { success: false, error: "Error de autenticación" }
      }

      if (!userData?.user) {
        return { success: false, error: "Usuario no autenticado" }
      }

      const userId = userData.user.id
      const shareId = uuidv4()

      // Calcular fecha de expiración
      let expiresAt: string | null = null
      const now = new Date()

      if (options.accessDuration === "1day") {
        const expiry = new Date(now)
        expiry.setDate(now.getDate() + 1)
        expiresAt = expiry.toISOString()
      } else if (options.accessDuration === "7days") {
        const expiry = new Date(now)
        expiry.setDate(now.getDate() + 7)
        expiresAt = expiry.toISOString()
      } else if (options.accessDuration === "30days") {
        const expiry = new Date(now)
        expiry.setDate(now.getDate() + 30)
        expiresAt = expiry.toISOString()
      }

      // Verificar si el documento existe
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("id")
        .eq("id", options.documentId)
        .single()

      if (docError) {
        console.error("Error al verificar documento:", docError)
        return { success: false, error: "El documento no existe o no tienes acceso" }
      }

      // Crear registro de compartir en la base de datos usando SQL directo para evitar problemas de esquema
      const insertQuery = `
        INSERT INTO document_shares (
          id, document_id, user_id, share_type, expires_at, permissions, password, created_at
        ) VALUES (
          '${shareId}', 
          '${options.documentId}', 
          '${userId}', 
          'link', 
          ${expiresAt ? `'${expiresAt}'` : "NULL"}, 
          '${JSON.stringify(options.permissions)}', 
          ${options.password ? `'${options.password}'` : "NULL"}, 
          '${now.toISOString()}'
        )
        RETURNING id;
      `

      const { data, error } = await supabase.rpc("run_sql", { query: insertQuery })

      if (error) {
        console.error("Error al insertar en document_shares:", error)
        return { success: false, error: `Error al guardar: ${error.message}` }
      }

      // Generar enlace de compartir
      const shareLink = `${window.location.origin}/compartir/${shareId}`

      // Generar datos para código QR (el mismo enlace)
      const qrCodeData = shareLink

      return {
        success: true,
        shareId,
        shareLink,
        qrCodeData,
      }
    } catch (error) {
      console.error("Error al generar enlace de compartir:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  },

  async shareViaEmail(options: ShareOptions): Promise<ShareResult> {
    try {
      // Primero generamos el enlace de compartir
      const linkResult = await this.generateShareLink(options)

      if (!linkResult.success) {
        throw new Error(linkResult.error || "Error al generar enlace")
      }

      // En un entorno real, aquí enviaríamos un correo electrónico
      // Para esta implementación, simularemos que el correo se envió correctamente

      // Actualizar el registro para indicar que se compartió por correo usando SQL directo
      const updateQuery = `
        UPDATE document_shares 
        SET share_type = 'email', 
            recipients = ARRAY[${options.emails?.map((email) => `'${email}'`).join(",")}]
        WHERE id = '${linkResult.shareId}';
      `

      const { error } = await supabase.rpc("run_sql", { query: updateQuery })

      if (error) {
        console.error("Error al actualizar document_shares:", error)
        throw new Error(`Error al actualizar: ${error.message}`)
      }

      return {
        success: true,
        shareId: linkResult.shareId,
        shareLink: linkResult.shareLink,
      }
    } catch (error) {
      console.error("Error al compartir por correo:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  },

  async generateQRCode(options: ShareOptions): Promise<ShareResult> {
    try {
      // Generamos el enlace de compartir primero
      const linkResult = await this.generateShareLink(options)

      if (!linkResult.success) {
        throw new Error(linkResult.error || "Error al generar enlace")
      }

      // Actualizar el registro para indicar que se compartió por QR usando SQL directo
      const updateQuery = `
        UPDATE document_shares 
        SET share_type = 'qr'
        WHERE id = '${linkResult.shareId}';
      `

      const { error } = await supabase.rpc("run_sql", { query: updateQuery })

      if (error) {
        console.error("Error al actualizar document_shares:", error)
        throw new Error(`Error al actualizar: ${error.message}`)
      }

      return {
        success: true,
        shareId: linkResult.shareId,
        shareLink: linkResult.shareLink,
        qrCodeData: linkResult.qrCodeData,
      }
    } catch (error) {
      console.error("Error al generar código QR:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  },

  async getDocumentShares(documentId: string): Promise<any[]> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error al obtener usuario:", userError)
        return []
      }

      if (!userData?.user) {
        throw new Error("Usuario no autenticado")
      }

      const userId = userData.user.id

      // Usar SQL directo para evitar problemas de esquema
      const selectQuery = `
        SELECT * FROM document_shares
        WHERE document_id = '${documentId}'
        AND user_id = '${userId}';
      `

      const { data, error } = await supabase.rpc("run_sql", { query: selectQuery })

      if (error) {
        console.error("Error al obtener compartidos:", error)
        throw error
      }

      return data?.rows || []
    } catch (error) {
      console.error("Error al obtener compartidos:", error)
      return []
    }
  },

  async revokeShare(shareId: string): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error al obtener usuario:", userError)
        return false
      }

      if (!userData?.user) {
        throw new Error("Usuario no autenticado")
      }

      const userId = userData.user.id

      // Usar SQL directo para evitar problemas de esquema
      const deleteQuery = `
        DELETE FROM document_shares
        WHERE id = '${shareId}'
        AND user_id = '${userId}';
      `

      const { error } = await supabase.rpc("run_sql", { query: deleteQuery })

      if (error) {
        console.error("Error al revocar compartido:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error al revocar compartido:", error)
      return false
    }
  },
}
