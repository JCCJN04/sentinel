// Import the browser client and rename it for convenience
import { supabaseBrowserClient as supabase } from "./supabase";

// Interface definitions (assuming these are correct for your DB schema)
export interface Document {
  id: string;
  name: string;
  category: string;
  tags: string[];
  date: string;
  expiry_date?: string;
  provider?: string;
  amount?: string;
  currency?: string;
  status: string;
  notes?: string;
  file_path: string;
  file_type: string;
  file_url: string; // This will be populated by getPublicUrl
  user_id: string; // Ensure this matches your table column name
  created_at: string;
  updated_at: string;
}

export interface DocumentUpload {
  name: string;
  category: string;
  tags: string[];
  date: string;
  expiry_date?: string;
  provider?: string;
  amount?: string;
  currency?: string;
  notes?: string;
  file: File;
  // 👇 CAMPOS AÑADIDOS COMO OPCIONALES
  patient_name?: string;
  doctor_name?: string;
  specialty?: string;
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

// ❗ ADDED: Define and export MEDICAL_CATEGORIES
// Replace the empty array with your actual categories
export const MEDICAL_CATEGORIES: string[] = [
  "General",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Radiology",
  // Add your medical categories here
];


/**
 * Fetches user statistics related to documents.
 * IMPORTANT: This function performs multiple DB queries. Consider optimizing
 * if performance becomes an issue (e.g., using database functions or views).
 * This function assumes it's called from a context where supabaseBrowserClient is valid (client-side).
 */
export async function getUserStats() {
  try {
    // Use the imported supabase client (originally supabaseBrowserClient)
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("getUserStats: Error fetching user or user not authenticated", userError);
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;

    // --- Perform queries concurrently for better performance ---
    const [
      totalDocumentsResult,
      recentDocumentsResult,
      expiringDocumentsResult,
      storageDocumentsResult,
    ] = await Promise.all([
      // 1. Total documents count
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      // 2. Recent documents count (last 7 days)
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // 3. Expiring documents count (status-based)
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "próximo a vencer"), // Assuming 'próximo a vencer' is the correct status
      // 4. Documents for storage calculation
      supabase
        .from("documents")
        .select("file_type") // Only select necessary field
        .eq("user_id", userId),
    ]);

    // --- Handle results and errors ---
    if (totalDocumentsResult.error) throw totalDocumentsResult.error;
    if (recentDocumentsResult.error) throw recentDocumentsResult.error;
    if (expiringDocumentsResult.error) throw expiringDocumentsResult.error;
    if (storageDocumentsResult.error) throw storageDocumentsResult.error;

    const totalDocuments = totalDocumentsResult.count ?? 0;
    const recentDocuments = recentDocumentsResult.count ?? 0;
    const expiringDocuments = expiringDocumentsResult.count ?? 0;
    const storageDocuments = storageDocumentsResult.data ?? [];

    // 5. Active Alerts (Simulated - replace with actual logic if needed)
    const activeAlerts = 0; // Placeholder

    // 6. Calculate estimated storage used
    let estimatedStorageBytes = 0;
    storageDocuments.forEach((doc) => {
      switch (doc.file_type?.toLowerCase()) {
        case "pdf": estimatedStorageBytes += 2 * 1024 * 1024; break; // ~2MB
        case "jpg": case "jpeg": case "png": estimatedStorageBytes += 1.5 * 1024 * 1024; break; // ~1.5MB
        case "doc": case "docx": estimatedStorageBytes += 1 * 1024 * 1024; break; // ~1MB
        default: estimatedStorageBytes += 500 * 1024; // 500KB default
      }
    });

    // Storage limit (example: 5GB) - consider making this configurable
    const storageLimit = 5 * 1024 * 1024 * 1024;

    return {
      totalDocuments,
      recentDocuments,
      storageUsed: estimatedStorageBytes,
      storageLimit,
      expiringDocuments,
      activeAlerts,
    };

  } catch (error) {
    console.error("Error getting user stats:", error);
    // Return default/empty stats on error
    return {
      totalDocuments: 0,
      recentDocuments: 0,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024,
      expiringDocuments: 0,
      activeAlerts: 0,
    };
  }
}

/**
 * Formats file size in bytes to a human-readable string (KB, MB, GB).
 * @param bytes - The file size in bytes.
 * @returns A formatted string representation of the file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Helper function to safely get public URL for a document.
 * @param filePath - The path of the file in Supabase storage.
 * @returns The public URL string or an empty string if an error occurs.
 */
function getPublicUrl(filePath: string): string {
    if (!filePath) return "";
    try {
        const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
        return data?.publicUrl ?? "";
    } catch (error) {
        console.error(`Error getting public URL for ${filePath}:`, error);
        return "";
    }
}

/**
 * Service object containing methods for document operations.
 * Assumes these methods are called from a context where supabaseBrowserClient is valid (client-side).
 */
export const documentService = {
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

    // Populate file URLs
    return data?.map(doc => ({
        ...doc,
        file_url: getPublicUrl(doc.file_path)
    })) || [];
  },

  /**
   * Fetches a limited number of recent documents for the user.
   * @param limit - The maximum number of documents to fetch. Defaults to 5.
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

      // Populate file URLs
    return data?.map(doc => ({
        ...doc,
        file_url: getPublicUrl(doc.file_path)
    })) || [];
  },

  /**
   * Fetches a single document by its ID.
   * @param id - The ID of the document to fetch.
   */
  async getDocumentById(id: string): Promise<Document | null> {
      // No auth check needed here if RLS policies handle authorization
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Handle 'PGRST116' (resource not found) gracefully
      if (error.code === 'PGRST116') {
          console.log(`Document with id ${id} not found.`);
          return null;
      }
      console.error(`Error fetching document with id ${id}:`, error);
      throw error;
    }

    // Populate file URL
    if (data) {
        data.file_url = getPublicUrl(data.file_path);
    }
    return data;
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

    // Ensure user_id is set
    reminderData.user_id = userData.user.id;

    const { data, error } = await supabase
      .from("document_reminders") // Ensure this table exists
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
      .select(`*, document:documents(*)`) // Join with documents table
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
    // RLS should handle authorization check
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
    // RLS should handle authorization check
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
      .from("document_shares") // Ensure this table exists
      .insert({
        document_id: documentId,
        owner_id: userData.user.id, // Assuming 'owner_id' is the column name
        shared_with: shareData.sharedWith,
        expiry_date: shareData.expiryDate,
        permissions: shareData.permissions,
        share_method: shareData.method,
        password: shareData.password, // Consider hashing passwords server-side if sensitive
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
      .select(`*, document:documents(*)`) // Join with documents table
      .eq("owner_id", userData.user.id) // Assuming 'owner_id'
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared documents:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Updates an existing share record.
   * @param shareId - The ID of the share record to update.
   * @param updates - An object containing the fields to update.
   */
  async updateSharedDocument(shareId: string, updates: any): Promise<any> {
      // RLS should handle authorization check
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
      // RLS should handle authorization check
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
      .gte("expiry_date", today) // Expiry date is today or later
      .order("expiry_date", { ascending: true }) // Closest expiration first
      .limit(limit);

    if (error) {
      console.error("Error fetching upcoming expirations:", error);
      throw error;
    }

      // Populate file URLs
    return data?.map(doc => ({
        ...doc,
        file_url: getPublicUrl(doc.file_path)
    })) || [];
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
      .not("expiry_date", "is", null); // Ensure expiry_date exists

    if (error) {
      console.error("Error fetching expiration dates:", error);
      throw error;
    }

    // Convert valid date strings to Date objects
    return data
      ?.map((doc) => doc.expiry_date ? new Date(doc.expiry_date) : null)
      .filter((date): date is Date => date !== null) || [];
  },

  /**
   * Uploads a document file and creates its corresponding record in the database.
   * @param documentData - Metadata for the document (name, category, etc.) and the File object.
   */
  async uploadDocument(documentData: DocumentUpload): Promise<Document> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("uploadDocument: User not authenticated.", userError);
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    const file = documentData.file;

    if (!file) {
        throw new Error("No file provided for upload.");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const fileName = `${crypto.randomUUID()}.${fileExt}`; // Use crypto.randomUUID for better uniqueness
    const filePath = `${userId}/${fileName}`;

    try {
      // 1. Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("documents") // Bucket name
        .upload(filePath, file, {
          cacheControl: "3600", // Cache for 1 hour
          upsert: false, // Don't overwrite existing file with same name
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }

      // 2. Get public URL (handle potential errors)
      const fileUrl = getPublicUrl(filePath);
        if (!fileUrl) {
            console.warn(`Could not get public URL for uploaded file: ${filePath}`);
            // Decide if this is critical - maybe proceed without URL or throw error
        }

      // 3. Determine document status based on expiry date
      let status = "vigente"; // Default status
      if (documentData.expiry_date) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today to start of day
            const expiryDate = new Date(documentData.expiry_date);
            expiryDate.setHours(0, 0, 0, 0); // Normalize expiry date

            const thirtyDaysFromNow = new Date(today);
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            if (expiryDate < today) {
                status = "vencido";
            } else if (expiryDate <= thirtyDaysFromNow) {
                status = "próximo a vencer";
            }
        } catch (dateError) {
            console.error("Error processing expiry date:", dateError, "Raw value:", documentData.expiry_date);
            // Keep status as 'vigente' or handle error appropriately
        }
      }

      // 4. Insert document record into the database
      const { data: insertedDoc, error: insertError } = await supabase
        .from("documents")
        .insert({
          name: documentData.name,
          category: documentData.category,
          tags: documentData.tags,
          date: documentData.date, // Ensure this is a valid date string (e.g., YYYY-MM-DD)
          expiry_date: documentData.expiry_date || null, // Use null if undefined
          provider: documentData.provider || null,
          amount: documentData.amount || null,
          currency: documentData.currency || null,
          status: status,
          notes: documentData.notes || null,
          file_path: filePath,
          file_type: fileExt,
          file_url: fileUrl, // Store the fetched URL
          user_id: userId,
        })
        .select() // Select the inserted row
        .single(); // Expect only one row

      if (insertError) {
        console.error("Error inserting document record:", insertError);
        // Attempt to delete the uploaded file if DB insert fails (cleanup)
        console.log(`Attempting to remove orphaned file: ${filePath}`);
        await supabase.storage.from("documents").remove([filePath]);
        throw insertError; // Re-throw the database error
      }

      // Return the complete document object including the ID generated by the DB
      return insertedDoc;

    } catch (error) {
      console.error("Error during document upload process:", error);
      // Ensure the error is re-thrown so the calling code knows about the failure
      throw error;
    }
  },

  /**
   * Updates an existing document record.
   * @param id - The ID of the document to update.
   * @param updates - An object containing the fields to update.
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    // Recalculate status if expiry_date is being updated
    if (updates.expiry_date !== undefined) { // Check if expiry_date is explicitly in updates
        let status = "vigente";
        if (updates.expiry_date) { // If expiry_date is being set (not null/empty)
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
        updates.status = status; // Update the status in the updates object
    } else if (updates.expiry_date === null && updates.status === undefined) {
        // If expiry_date is explicitly set to null and status is not being updated, set status to vigente
        updates.status = "vigente";
    }


    // Perform the update (RLS should handle authorization)
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

    // Refresh the file URL in case file_path changed (though unlikely in typical updates)
    if (data) {
        data.file_url = getPublicUrl(data.file_path);
    }

    return data;
  },

  /**
   * Deletes a document record and its associated file from storage.
   * Handles history logging and trigger disabling/enabling if necessary.
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

      // --- Optional: Manual History Logging & Trigger Disabling ---
      // If you have complex triggers or need specific history logging before deletion,
      // implement it here. Example using RPC calls (ensure these exist in your DB):
      /*
      try {
          console.log(`Logging deletion for document ${id}`);
          await supabase.from("document_history").insert({
              document_id: id, action: "deleted", user_id: userId, details: "Document deleted via service"
          });
          console.log(`Disabling history trigger for document ${id}`);
          await supabase.rpc("disable_document_history_trigger"); // Ensure this function exists
      } catch(rpcError) {
          console.error("Error during pre-delete RPC calls:", rpcError);
          // Decide if you should proceed or throw
      }
      */
      // --- End Optional Section ---

      // 2. Delete the document record from the database
      console.log(`Deleting document record ${id} from database.`);
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      // --- Optional: Re-enable Trigger ---
      /*
      try {
          console.log(`Re-enabling history trigger after deleting ${id}`);
          await supabase.rpc("enable_document_history_trigger"); // Ensure this function exists
      } catch(rpcError) {
          console.error("Error enabling history trigger:", rpcError);
      }
      */
      // --- End Optional Section ---

      if (deleteError) {
        console.error(`Error deleting document record ${id}:`, deleteError);
        // Don't necessarily throw here if you want to attempt file deletion anyway
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
          // Log warning but don't throw - the DB record is already gone.
          console.warn(`Error deleting file ${filePath} from storage:`, storageError);
        } else {
            console.log(`Successfully deleted file ${filePath} from storage.`);
        }
      } else {
          console.log(`No file path found for document ${id}, skipping storage deletion.`);
      }

      // If the DB delete failed earlier, re-throw the error now
      if (deleteError) {
          throw deleteError;
      }

    } catch (error) {
      console.error(`Critical error during deleteDocument process for id ${id}:`, error);
      throw error; // Re-throw the error for the caller to handle
    }
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

    // Populate file URLs
    return data?.map(doc => ({
        ...doc,
        file_url: getPublicUrl(doc.file_path)
    })) || [];
  },

  /**
   * Searches documents across multiple fields (name, notes) for the user.
   * @param query - The search term.
   */
  async searchDocuments(query: string): Promise<Document[]> {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
          console.error("searchDocuments: User not authenticated.", userError);
          throw new Error("User not authenticated");
      }

    // Use textSearch for potentially better performance if you have tsvector columns,
    // otherwise use ilike for case-insensitive partial matching.
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userData.user.id)
      .or(`name.ilike.%${query}%,notes.ilike.%${query}%,tags::text.ilike.%${query}%`) // Search tags too
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error searching documents with query "${query}":`, error);
      throw error;
    }

      // Populate file URLs
    return data?.map(doc => ({
        ...doc,
        file_url: getPublicUrl(doc.file_path)
    })) || [];
  },
};