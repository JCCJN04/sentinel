// lib/document-service.ts
import { supabaseBrowserClient as supabase } from "./supabase";

// Interface definitions
export interface Document {
  id: string;
  name: string;
  category: string;
  tags: string[];
  date: string;
  expiry_date?: string | null;
  provider?: string | null;
  amount?: string | null;
  currency?: string | null;
  status: string;
  notes?: string | null;
  file_path: string; // Key for generating URLs
  file_type: string;
  file_url?: string; // MODIFICADO: URL es opcional, se generará en el cliente
  user_id: string;
  created_at: string;
  updated_at: string;
  patient_name?: string | null;
  doctor_name?: string | null;
  specialty?: string | null;
}

export interface DocumentUpload {
  name: string;
  category: string | null;
  tags?: string[];
  date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  file: File;
  provider?: string | null;
  amount?: string | null;
  currency?: string | null;
  patient_name?: string | null;
  doctor_name?: string | null;
  specialty?: string | null;
}

export interface ShareOptions {
  sharedWith: string;
  expiryDate?: string;
  permissions: {
    view: boolean;
    download: boolean;
    print: boolean;
    edit: boolean;
  };
  method: "link" | "email" | "qr";
  password?: string;
}

// Nueva interfaz para un registro de documento compartido
export interface DocumentShareRecord {
  id: string;
  document_id: string;
  owner_id: string;
  shared_with: string;
  permissions: {
    view: boolean;
    download: boolean;
    print: boolean;
    edit: boolean;
  };
  share_method: "link" | "email" | "qr";
  password?: string | null;
  expiry_date?: string | null;
  access_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  document: Document; // Relación con la tabla de documentos
}


export const MEDICAL_CATEGORIES: string[] = [
  "General",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Radiology",
];

/**
 * Formats file size in bytes to a human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}


// --- UPLOADDOCUMENT FUNCTION (EXPORTED INDIVIDUALLY) ---
export async function uploadDocument(documentData: DocumentUpload): Promise<Document> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("uploadDocument: User not authenticated.", userError);
    throw new Error("Usuario no autenticado para subir el documento.");
  }

  const userId = user.id;
  const file = documentData.file;

  if (!file) {
    throw new Error("No se proporcionó ningún archivo para la subida.");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  const fileName = `${globalThis.crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    console.log(`Subiendo archivo a: documents/${filePath}`);
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir el archivo a Supabase Storage:", uploadError);
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }
    console.log("Archivo subido exitosamente a Storage.");

    let status = "vigente";
    if (documentData.expiry_date) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(documentData.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        if (expiryDate < today) {
          status = "vencido";
        } else if (expiryDate <= thirtyDaysFromNow) {
          status = "próximo a vencer";
        }
      } catch (dateError) {
        console.error("Error procesando fecha de expiración:", dateError, "Valor recibido:", documentData.expiry_date);
      }
    }

    const documentRecordToInsert = {
      name: documentData.name,
      category: documentData.category ?? MEDICAL_CATEGORIES[0] ?? "General",
      tags: documentData.tags,
      date: documentData.date,
      expiry_date: documentData.expiry_date || null,
      provider: documentData.provider || null,
      amount: documentData.amount || null,
      currency: documentData.currency || null,
      status: status,
      notes: documentData.notes || null,
      file_path: filePath,
      file_type: fileExt,
      user_id: userId,
      patient_name: documentData.patient_name || null,
      doctor_name: documentData.doctor_name || null,
      specialty: documentData.specialty || null,
    };

    console.log("Insertando registro del documento:", documentRecordToInsert);
    const { data: insertedDoc, error: insertError } = await supabase
      .from("documents")
      .insert(documentRecordToInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Error al insertar el registro del documento en la BD:", insertError);
      console.log(`Intentando eliminar archivo huérfano: ${filePath}`);
      const { error: removeError } = await supabase.storage.from("documents").remove([filePath]);
      if (removeError) console.error("Error al eliminar archivo huérfano de Storage:", removeError);
      throw new Error(`Error al guardar datos del documento: ${insertError.message}`);
    }
    console.log("Registro del documento insertado exitosamente:", insertedDoc);
    return insertedDoc as Document;

  } catch (error) {
    console.error("Error general durante el proceso de subida del documento:", error);
    throw error;
  }
}


/**
 * Service object containing methods for document operations.
 */
export const documentService = {
  /**
   * Fetches user statistics related to documents.
   */
  async getUserStats() { // <-- Ahora es un método de documentService
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("getUserStats: Error fetching user or user not authenticated", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;
      const [
        totalDocumentsResult,
        recentDocumentsResult,
        expiringDocumentsResult,
        storageDocumentsResult,
      ] = await Promise.all([
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "próximo a vencer"),
        supabase.from("documents").select("file_type").eq("user_id", userId),
      ]);

      if (totalDocumentsResult.error) throw totalDocumentsResult.error;
      if (recentDocumentsResult.error) throw recentDocumentsResult.error;
      if (expiringDocumentsResult.error) throw expiringDocumentsResult.error;
      if (storageDocumentsResult.error) throw storageDocumentsResult.error;

      const totalDocuments = totalDocumentsResult.count ?? 0;
      const recentDocuments = recentDocumentsResult.count ?? 0;
      const expiringDocuments = expiringDocumentsResult.count ?? 0;
      const storageDocs = storageDocumentsResult.data ?? [];

      let estimatedStorageBytes = 0;
      storageDocs.forEach((doc: any) => {
        switch (doc.file_type?.toLowerCase()) {
          case "pdf": estimatedStorageBytes += 2 * 1024 * 1024; break;
          case "jpg": case "jpeg": case "png": estimatedStorageBytes += 1.5 * 1024 * 1024; break;
          case "doc": case "docx": estimatedStorageBytes += 1 * 1024 * 1024; break;
          default: estimatedStorageBytes += 500 * 1024;
        }
      });
      const storageLimit = 5 * 1024 * 1024 * 1024;
      return {
          totalDocuments,
          recentDocuments,
          storageUsed: estimatedStorageBytes,
          storageLimit,
          expiringDocuments,
          activeAlerts: 0
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      // Es importante propagar el error para que el componente que llama pueda manejarlo
      throw error; // Propaga el error para que el componente DashboardStats lo capture
    }
  },

  /**
   * Fetches all documents for the currently authenticated user.
   */
  async getDocuments(): Promise<Document[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("getDocuments: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches a limited number of recent documents for the user.
   */
  async getRecentDocuments(limit = 5): Promise<Document[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
      console.error("getRecentDocuments: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent documents:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches a single document by its ID.
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
          console.log(`Document with id ${id} not found.`);
          return null;
      }
      console.error(`Error fetching document with id ${id}:`, error);
      throw error;
    }

    return data as Document | null;
  },

  /**
   * Updates an existing document record.
   */
  async updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'user_id' | 'created_at' | 'file_path' | 'file_type' | 'file_url'>>): Promise<Document> {
    if (updates.expiry_date !== undefined) {
        let status = "vigente";
        if (updates.expiry_date) {
            try {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const expiryDate = new Date(updates.expiry_date); expiryDate.setHours(0, 0, 0, 0);
                const thirtyDaysFromNow = new Date(today); thirtyDaysFromNow.setDate(today.getDate() + 30);

                if (expiryDate < today) status = "vencido";
                else if (expiryDate <= thirtyDaysFromNow) status = "próximo a vencer";
            } catch (dateError) {
                 console.error("Error processing expiry date during update:", dateError, "Raw value:", updates.expiry_date);
            }
        }
        (updates as Document).status = status;
    } else if (updates.expiry_date === null && (updates as Document).status === undefined) {
        (updates as Document).status = "vigente";
    }

    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating document with id ${id}:`, error);
      throw error;
    }

    return data as Document;
  },

  /**
   * Deletes a document record and its associated file from storage.
   * @param id - The ID of the document to delete.
   */
  async deleteDocument(id: string): Promise<void> {
    console.log(`Attempting to delete document with ID: ${id}`);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            console.error("deleteDocument: User not authenticated.", userError);
            throw new Error("User not authenticated");
        }
        const userId = userData.user.id;

      // 1. Fetch document to get file_path before deleting the record
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", id)
        .eq("user_id", userId) // Ensure user owns the document
        .single();

      // Handle case where document doesn't exist or user doesn't own it
      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found
            console.warn(`Document with id ${id} not found or user ${userId} does not have permission.`);
            return; // Nothing to delete
        }
        console.error(`Error fetching document ${id} for deletion:`, fetchError);
        throw fetchError;
      }

      const filePath = document?.file_path;

      // 2. Delete the document record from the database
      console.log(`Deleting document record ${id} from database.`);
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error(`Error deleting document record ${id}:`, deleteError);
      } else {
          console.log(`Successfully deleted document record ${id}.`);
      }


      // 3. Delete the file from storage if a path exists
      if (filePath) {
        console.log(`Attempting to delete file from storage: ${filePath}`);
        const { error: storageError } = await supabase.storage
          .from("documents")
          .remove([filePath]);

        if (storageError) {
          console.warn(`Error deleting file ${filePath} from storage:`, storageError.message);
        } else {
            console.log(`Successfully deleted file ${filePath} from storage.`);
        }
      } else {
          console.log(`No file path found for document ${id}, skipping storage deletion.`);
      }

      if (deleteError) {
          throw deleteError;
      }

    } catch (error) {
      console.error(`Critical error during deleteDocument process for id ${id}:`, error);
      throw error;
    }
  },

  // --- Reminder Functions ---
  /**
   * Creates a new reminder associated with a document.
   * @param reminderData - Data for the new reminder. Should include document_id, date, etc.
   */
  async createReminder(reminderData: any): Promise<any> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("createReminder: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    reminderData.user_id = userData.user.id;

    const { data, error } = await supabase
      .from("document_reminders")
      .insert(reminderData)
      .select()
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches all reminders for the authenticated user, joining with document data.
   */
  async getReminders(): Promise<any[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
      console.error("getReminders: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("document_reminders")
      .select(`*, document:documents(*)`)
      .eq("user_id", userData.user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Updates an existing reminder.
   * @param id - The ID of the reminder to update.
   * @param updates - An object containing the fields to update.
   */
  async updateReminder(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from("document_reminders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating reminder with id ${id}:`, error);
      throw error;
    }
    return data;
  },

  /**
   * Deletes a reminder by its ID.
   * @param id - The ID of the reminder to delete.
   */
  async deleteReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from("document_reminders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting reminder with id ${id}:`, error);
      throw error;
    }
  },

  // --- Sharing Functions ---
  /**
   * Creates a share record for a document.
   * @param documentId - The ID of the document being shared.
   * @param shareData - Options for sharing (recipient, permissions, etc.).
   */
  async shareDocument(documentId: string, shareData: ShareOptions): Promise<any> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("shareDocument: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("document_shares")
      .insert({
        document_id: documentId,
        owner_id: userData.user.id,
        shared_with: shareData.sharedWith,
        expiry_date: shareData.expiryDate,
        permissions: shareData.permissions,
        share_method: shareData.method,
        password: shareData.password,
        access_count: 0,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error(`Error sharing document with id ${documentId}:`, error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches all share records created by the authenticated user.
   */
  async getSharedDocuments(): Promise<any[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("getSharedDocuments: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("document_shares")
      .select(`*, document:documents(*)`)
      .eq("owner_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared documents:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches a specific shared document record by its share ID.
   * This function is used by the public shared document view.
   * It also increments the access count.
   * @param shareId - The ID of the share record.
   * @param providedPassword - Optional password provided by the user.
   */
  async getSharedDocumentById(shareId: string, providedPassword?: string): Promise<{ documentShare: DocumentShareRecord | null; documentUrl: string | null; error?: string }> {
    try {
      // Fetch the share record and the associated document
      const { data: shareRecord, error: shareError } = await supabase
        .from("document_shares")
        .select(`*, document:documents(*)`)
        .eq("id", shareId)
        .single();

      if (shareError) {
        if (shareError.code === 'PGRST116') {
          return { documentShare: null, documentUrl: null, error: "Enlace de documento compartido no encontrado." };
        }
        console.error(`Error fetching shared document record ${shareId}:`, shareError);
        return { documentShare: null, documentUrl: null, error: "Error al cargar el enlace compartido." };
      }

      if (!shareRecord) {
        return { documentShare: null, documentUrl: null, error: "Enlace de documento compartido no encontrado." };
      }

      // Check expiry date
      if (shareRecord.expiry_date && new Date(shareRecord.expiry_date) < new Date()) {
        await supabase.from("document_shares").update({ status: "expired" }).eq("id", shareId);
        return { documentShare: null, documentUrl: null, error: "Este enlace de compartición ha caducado." };
      }

      // Check password if required
      if (shareRecord.password && shareRecord.password !== providedPassword) {
        return { documentShare: shareRecord as DocumentShareRecord, documentUrl: null, error: "Contraseña incorrecta." };
      }

      // Increment access count (fire and forget, or handle errors if critical)
      await supabase.rpc('increment_share_access_count', { share_id: shareId });

      // Get the public URL for the document file
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(shareRecord.document.file_path);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return { documentShare: shareRecord as DocumentShareRecord, documentUrl: null, error: "No se pudo obtener la URL del archivo del documento." };
      }

      return { documentShare: shareRecord as DocumentShareRecord, documentUrl: publicUrlData.publicUrl };

    } catch (error: any) {
      console.error(`Error in getSharedDocumentById for shareId ${shareId}:`, error);
      return { documentShare: null, documentUrl: null, error: error.message || "Error inesperado al acceder al documento compartido." };
    }
  },

  /**
   * Updates an existing share record.
   * @param shareId - The ID of the share record to update.
   * @param updates - An object containing the fields to update.
   */
  async updateSharedDocument(shareId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from("document_shares")
      .update(updates)
      .eq("id", shareId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating shared document with id ${shareId}:`, error);
      throw error;
    }
    return data;
  },

  /**
   * Deletes a share record by its ID.
   * @param shareId - The ID of the share record to delete.
   */
  async deleteSharedDocument(shareId: string): Promise<void> {
    const { error } = await supabase
      .from("document_shares")
      .delete()
      .eq("id", shareId);

    if (error) {
      console.error(`Error deleting shared document with id ${shareId}:`, error);
      throw error;
    }
  },

  // --- Other Document Functions ---

  /**
   * Fetches documents nearing their expiration date for the user.
   * @param limit - Maximum number of documents to fetch. Defaults to 5.
   */
  async getUpcomingExpirations(limit = 5): Promise<Document[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
      console.error("getUpcomingExpirations: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .gte("expiry_date", today)
      .not("expiry_date", "is", null)
      .order("expiry_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching upcoming expirations:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches expiration dates within the next 3 months for calendar highlighting.
   */
  async getExpirationDates(): Promise<Date[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("getExpirationDates: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    const { data, error } = await supabase
      .from("documents")
      .select("expiry_date")
      .eq("user_id", userData.user.id)
      .gte("expiry_date", today.toISOString().split("T")[0])
      .lte("expiry_date", threeMonthsLater.toISOString().split("T")[0])
      .not("expiry_date", "is", null);

    if (error) {
      console.error("Error fetching expiration dates:", error);
      throw error;
    }

    return data
      ?.map((doc) => doc.expiry_date ? new Date(doc.expiry_date) : null)
      .filter((date): date is Date => date !== null) || [];
  },

  /**
   * Fetches documents belonging to a specific category for the user.
   * @param category - The category name to filter by.
   */
  async getDocumentsByCategory(category: string): Promise<Document[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("getDocumentsByCategory: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching documents with category ${category}:`, error);
      throw error;
    }

    return data || [];
  },

  /**
   * Searches documents across multiple fields (name, notes, tags) for the user.
   * @param query - The search term.
   */
  async searchDocuments(query: string): Promise<Document[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
          console.error("searchDocuments: User not authenticated.", userError);
          throw new Error("User not authenticated");
      }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .or(`name.ilike.%${query}%,notes.ilike.%${query}%,tags::text.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error searching documents with query "${query}":`, error);
      throw error;
    }

    return data || [];
  },
};
