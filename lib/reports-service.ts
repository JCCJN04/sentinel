// lib/reports-service.ts
'use server'; // Indicates this is a Server Action or Server Module

import { supabaseBrowserClient as supabase } from "./supabase"; // Use supabaseBrowserClient for client-side functionality


// Interface definitions
export interface DocumentStats { // CORRECTED: Removed duplicate 'export'
    totalDocuments: number;
    categoriesCount: number;
    expiringDocuments: number;
    storageUsed: number; // Size in bytes
    storageLimit: number; // Size in bytes
    recentDocuments: number; // Count of documents added recently
}

export interface CategoryCount {
    name: string; // Category name
    value: number; // Number of documents in this category
    color: string; // Hex color code for the category
}

export interface MonthlyCount {
    name: string; // Month name (e.g., "Ene", "Feb")
    documentos: number; // Number of documents created in this month
}

export interface ExpenseData {
    name: string; // Month name (e.g., "Ene", "Feb")
    // Dynamically include categories as keys with their total amount as value
    [key: string]: string | number;
}

// --- Color Palette for Categories ---
// Define a consistent color mapping for categories used in charts.
const categoryColors: Record<string, string> = {
    Hogar: "#0e34a0",
    Finanzas: "#2f3061",
    Salud: "#5f5980",
    Vehículos: "#28a745",
    Educación: "#17a2b8",
    Identidad: "#ffc107",
    Trabajo: "#fd7e14",
    Seguros: "#6f42c1",
    Impuestos: "#e83e8c",
    Servicios: "#20c997",
    Alimentación: "#dc3545", // Added example category
    Entretenimiento: "#6610f2", // Added example category
    Transporte: "#fd7e14", // Added example category (can reuse colors or add new)
    "Sin categoría": "#6c757d", // Color for uncategorized
    Otros: "#adb5bd", // Color for 'Otros' if different from uncategorized
};

/**
 * Gets a predefined color for a category or a default color.
 * @param category - The name of the category.
 * @returns A hex color string.
 */
function getCategoryColor(category: string): string {
    return categoryColors[category] || categoryColors["Sin categoría"]; // Fallback to default
}

// Define a more specific type for documents used in expense calculations
interface ExpenseDocumentData {
    id: string; // Assuming ID is a string, adjust if it's a number
    category: string | null;
    amount: string | null; // Supabase might return numbers as strings or numbers
    currency: string | null;
    date: string | null; // Dates are often strings from DB, then parsed
}


/**
 * Service object for generating reports based on user documents.
 * Assumes these methods are called from a context where supabaseBrowserClient is valid (client-side).
 */
export const reportsService = {
  /**
   * Fetches general statistics about the user's documents.
   * @param year - Optional year (YYYY) to filter statistics. If omitted, stats are for all time.
   */
  async getDocumentStats(year?: string): Promise<DocumentStats> {
    console.log(`Fetching document stats ${year ? `for year ${year}` : 'for all time'}...`);
    try {
      // Use the imported supabase client (originally supabaseBrowserClient)
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("getDocumentStats: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;

      // Base query for user's documents
      let baseQuery = supabase.from("documents").select().eq("user_id", userId);
      let countQuery = supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId);

      // Apply year filter if provided
      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31T23:59:59.999Z`; // Include full end day
        // Apply filter to both base query (for storage calculation) and count query
        baseQuery = baseQuery.gte("date", startDate).lte("date", endDate);
        countQuery = countQuery.gte("date", startDate).lte("date", endDate);
        console.log(`Applying year filter: ${startDate} to ${endDate}`);
      }

      // --- Perform queries concurrently ---
      const [
        totalDocumentsResult,
        recentDocumentsResult,
        categoriesResult,
        expiringDocumentsResult,
        storageDocumentsResult, // Use baseQuery which includes year filter if applicable
      ] = await Promise.all([
        // 1. Total documents count (with year filter if applicable)
        countQuery,
        // 2. Recent documents count (last 7 days, independent of year filter)
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        // 3. Unique categories (with year filter if applicable)
        baseQuery.select("category"), // Select only category from the potentially filtered set
        // 4. Expiring documents count (status-based, independent of year filter)
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "próximo a vencer"), // Assumes status is accurate
        // 5. Documents for storage calculation (with year filter if applicable)
        baseQuery.select("file_type"), // Select only file_type from the potentially filtered set
      ]);

      // --- Handle results and errors ---
      if (totalDocumentsResult.error) throw totalDocumentsResult.error;
      if (recentDocumentsResult.error) throw recentDocumentsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (expiringDocumentsResult.error) throw expiringDocumentsResult.error;
      if (storageDocumentsResult.error) throw storageDocumentsResult.error;

      const totalDocuments = totalDocumentsResult.count ?? 0;
      const recentDocuments = recentDocumentsResult.count ?? 0;
      const expiringDocuments = expiringDocumentsResult.count ?? 0;
      const storageDocumentsData = storageDocumentsResult.data ?? []; // Renamed to avoid conflict
      const categoriesData = categoriesResult.data ?? []; // Renamed to avoid conflict


      // Count unique categories from the fetched (potentially filtered) list
      const uniqueCategories = new Set(categoriesData.map((doc: {category: string | null}) => doc.category || "Sin categoría"));
      const categoriesCount = uniqueCategories.size;

      // Calculate estimated storage used based on fetched (potentially filtered) documents
      let estimatedStorageBytes = 0;
      storageDocumentsData.forEach((doc: {file_type: string | null}) => {
          switch (doc.file_type?.toLowerCase()) {
            case "pdf": estimatedStorageBytes += 2 * 1024 * 1024; break; // ~2MB
            case "jpg": case "jpeg": case "png": estimatedStorageBytes += 1.5 * 1024 * 1024; break; // ~1.5MB
            case "doc": case "docx": estimatedStorageBytes += 1 * 1024 * 1024; break; // ~1MB
            default: estimatedStorageBytes += 500 * 1024; // 500KB default
          }
      });

      // Storage limit (example: 5GB)
      const storageLimit = 5 * 1024 * 1024 * 1024;
      console.log("Document stats calculated successfully.");

      return {
        totalDocuments,
        categoriesCount,
        recentDocuments,
        storageUsed: estimatedStorageBytes,
        storageLimit,
        expiringDocuments,
      };

    } catch (error) {
      console.error("Error getting document stats:", error);
      // Return default stats on error
      return {
        totalDocuments: 0,
        categoriesCount: 0,
        recentDocuments: 0,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024,
        expiringDocuments: 0,
      };
    }
  },

  /**
   * Fetches the count of documents per category for the user.
   * @param year - Optional year (YYYY) to filter data.
   */
  async getDocumentsByCategory(year?: string): Promise<CategoryCount[]> {
       console.log(`Fetching documents by category ${year ? `for year ${year}` : 'for all time'}...`);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
           console.error("getDocumentsByCategory: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;

      // Base query to select categories for the user
      let query = supabase
        .from("documents")
        .select("category") // Only need category
        .eq("user_id", userId);

      // Apply year filter if provided
      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31T23:59:59.999Z`;
        query = query.gte("date", startDate).lte("date", endDate);
           console.log(`Applying year filter: ${startDate} to ${endDate}`);
      }

      const { data, error } = await query;

      if (error) {
             console.error("Error fetching categories:", error);
             throw error;
      }

      // Count documents per category
      const categoryCounts: Record<string, number> = {};
      (data || []).forEach((doc: {category: string | null}) => {
        const category = doc.category || "Sin categoría"; // Group null/empty categories
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // Convert to the format required by the chart, including color
      const result: CategoryCount[] = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name), // Assign color based on category name
      }));

      console.log("Documents by category calculated:", result);
      return result;

    } catch (error) {
      console.error("Error getting documents by category:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Fetches the count of documents created per month for a given year.
   * @param year - The year (YYYY) to fetch data for. Defaults to the current year.
   */
  async getDocumentsByMonth(year: string = new Date().getFullYear().toString()): Promise<MonthlyCount[]> {
       console.log(`Fetching documents by month for year ${year}...`);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
           console.error("getDocumentsByMonth: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;

      // Define date range for the specified year
      const startDate = `${year}-01-01T00:00:00.000Z`;
      const endDate = `${year}-12-31T23:59:59.999Z`;

      // Fetch creation dates within the year range
      const { data, error } = await supabase
        .from("documents")
        .select("created_at") // Only need creation timestamp
        .eq("user_id", userId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
           console.error("Error fetching document creation dates:", error);
           throw error;
      }

      // Initialize monthly counts with Spanish month abbreviations
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthlyCounts: Record<string, number> = monthNames.reduce((acc, month) => {
           acc[month] = 0;
           return acc;
      }, {} as Record<string, number>);


      // Count documents per month based on created_at
      (data || []).forEach((doc: { created_at: string | null }) => {
        try {
            if (!doc.created_at) {
                console.warn(`Skipping document due to missing created_at date`);
                return;
            }
            const date = new Date(doc.created_at);
            const monthIndex = date.getMonth(); // 0-11
            if (monthIndex >= 0 && monthIndex < 12) {
                const month = monthNames[monthIndex];
                monthlyCounts[month] += 1;
            } else {
                   console.warn(`Invalid month index derived from created_at: ${doc.created_at}`);
            }
        } catch(e) {
            console.warn(`Could not parse created_at date: ${doc.created_at}`, e);
        }
      });

      // Convert to the format required by the chart
      const result: MonthlyCount[] = monthNames.map((name) => ({
        name,
        documentos: monthlyCounts[name],
      }));

      console.log("Documents by month calculated:", result);
      return result;

    } catch (error) {
      console.error("Error getting documents by month:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Fetches and aggregates document amounts (assumed expenses) by category per month for a given year.
   * Note: This assumes 'amount' represents an expense and uses a predefined set of expense categories.
   * @param year - The year (YYYY) to fetch data for. Defaults to the current year.
   */
  async getExpensesByMonth(year: string = new Date().getFullYear().toString()): Promise<ExpenseData[]> {
    console.log(`Fetching expenses by month for year ${year}...`);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
           console.error("getExpensesByMonth: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;

      // Define date range for the specified year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Fetch documents with amount and date within the year range
      // *** FIX: Added 'id' to the select statement ***
      const { data, error } = await supabase
        .from("documents")
        .select("id, category, amount, currency, date") // Select relevant fields including id
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .not("amount", "is", null); // Only include documents with an amount

      if (error) {
           console.error("Error fetching documents for expense calculation:", error);
           throw error;
      }

      // Initialize monthly expense data structure with predefined categories
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const expenseCategories = ["Hogar", "Servicios", "Transporte", "Alimentación", "Entretenimiento", "Otros"]; // Define categories for the chart
      const result: ExpenseData[] = monthNames.map((name) => ({
           name,
           ...expenseCategories.reduce((acc, cat) => { acc[cat] = 0; return acc; }, {} as Record<string, number>) // Initialize all categories to 0
      }));

      // Process documents and aggregate amounts by category and month
      (data || []).forEach((doc: ExpenseDocumentData) => { // Use the specific type here
        if (!doc.amount || !doc.date) {
            console.warn(`Skipping document id=${doc.id} due to missing amount or date.`);
            return; // Skip if amount or date is missing
        }

        let amountValue: number; // Renamed to avoid conflict with doc.amount
        let dateValue: Date; // Renamed to avoid conflict with doc.date
        try {
            // Attempt to parse amount and date
            amountValue = Number.parseFloat(doc.amount); // doc.amount is string | null
            dateValue = new Date(doc.date); // doc.date is string | null

            // Check if parsing was successful
            if (isNaN(amountValue) || isNaN(dateValue.getTime())) {
                   console.warn(`Skipping document due to invalid amount or date: id=${doc.id}, amount=${doc.amount}, date=${doc.date}`);
                   return;
            }
        } catch (e) {
            console.warn(`Error parsing amount or date for document id=${doc.id}:`, e);
            return; // Skip this document on error
        }


        const monthIndex = dateValue.getMonth(); // 0-11

        // Map document category to one of the predefined expense categories
        let mappedCategory = "Otros"; // Default category
        const docCategory = doc.category || ""; // Handle null category
        if (expenseCategories.includes(docCategory)) {
            mappedCategory = docCategory;
        } else if (docCategory === "Vehículos") { // Example mapping
               mappedCategory = "Transporte";
        }
        // Add more specific mappings if needed

        // Add the amount to the correct month and category
        if (monthIndex >= 0 && monthIndex < 12) {
            // Ensure the category exists on the result object before adding to it
            if (typeof result[monthIndex][mappedCategory] === 'number') {
                   result[monthIndex][mappedCategory] = (result[monthIndex][mappedCategory] as number) + amountValue;
            } else {
                // This case should ideally not happen if expenseCategories are initialized correctly
                console.warn(`Category ${mappedCategory} not initialized for month ${monthNames[monthIndex]}. Initializing to 0.`);
                result[monthIndex][mappedCategory] = amountValue;
            }
        }
      });

      console.log("Expenses by month calculated:", result);
      return result;

    } catch (error) {
      console.error("Error getting expenses by month:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Fetches a limited list of recent documents with selected fields for table display.
   * @param limit - Maximum number of documents to fetch. Defaults to 10.
   * @param year - Optional year (YYYY) to filter documents.
   */
  async getRecentDocumentsForTable(limit = 10, year?: string): Promise<any[]> {
    console.log(`Fetching recent documents for table (limit ${limit}) ${year ? `for year ${year}` : ''}...`);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
           console.error("getRecentDocumentsForTable: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }
      const userId = userData.user.id;

      // Base query to select specific fields for the table
      let query = supabase
        .from("documents")
        .select("id, name, category, date, file_type, status") // Select fields needed for the table
        .eq("user_id", userId)
        .order("created_at", { ascending: false }) // Order by creation date descending
        .limit(limit); // Apply limit

      // Apply year filter if provided (filters based on the document's 'date' field)
      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31T23:59:59.999Z`;
        query = query.gte("date", startDate).lte("date", endDate);
           console.log(`Applying year filter: ${startDate} to ${endDate}`);
      }

      const { data, error } = await query;

      if (error) {
           console.error("Error fetching recent documents for table:", error);
           throw error;
      }

      console.log(`Fetched ${data?.length || 0} documents for table.`);
      return data || []; // Return fetched data or empty array

    } catch (error) {
      console.error("Error getting recent documents for table:", error);
      return []; // Return empty array on error
    }
  },
};

/**
 * Formats file size in bytes to a human-readable string (KB, MB, GB).
 * Note: This function is duplicated from document-service. Consider moving to a shared utils file.
 * @param bytes - The file size in bytes.
 * @returns A formatted string representation of the file size.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    // Handle potential log(0) or negative bytes
    if (bytes < 0) bytes = 0;
    const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k));
    // Ensure index i is within bounds
    const index = Math.min(i, sizes.length - 1);
    return Number.parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + " " + sizes[index];
}