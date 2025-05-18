// Import the browser client and rename it for convenience
import { supabaseBrowserClient as supabase } from "./supabase";

// Interface definitions
export interface DocumentAnalysis {
  totalDocuments: number;
  expiringDocuments: number;
  missingMetadata: number;
  duplicateSuspects: number;
  categoryDistribution: Record<string, number>;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Service object for analyzing user documents.
 * Assumes these methods are called from a context where supabaseBrowserClient is valid (client-side).
 */
export const documentAnalysisService = {
  /**
   * Analyzes documents for the currently authenticated user.
   * Provides statistics and recommendations based on the analysis.
   */
  async analyzeDocuments(): Promise<DocumentAnalysis> {
    console.log("Starting document analysis...");
    try {
      // Use the imported supabase client (originally supabaseBrowserClient)
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("analyzeDocuments: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }

      const userId = userData.user.id;
      console.log(`Analyzing documents for user: ${userId}`);

      // 1. Fetch all documents for the user
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("*") // Select necessary fields: id, name, category, tags, date, expiry_date
        .eq("user_id", userId);

      if (docsError) {
          console.error("Error fetching documents for analysis:", docsError);
          throw docsError;
      }

      const docs = documents || [];
      const totalDocuments = docs.length;
      console.log(`Fetched ${totalDocuments} documents.`);

      // 2. Analyze expiring documents (within next 30 days)
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const thirtyDaysLater = new Date(today); thirtyDaysLater.setDate(today.getDate() + 30);

      const expiringDocs = docs.filter((doc) => {
        if (!doc.expiry_date) return false;
        try {
            const expiryDate = new Date(doc.expiry_date); expiryDate.setHours(0, 0, 0, 0);
            return expiryDate <= thirtyDaysLater && expiryDate >= today;
        } catch (e) {
            console.warn(`Could not parse expiry_date '${doc.expiry_date}' for doc id ${doc.id}`);
            return false;
        }
      });
      console.log(`${expiringDocs.length} documents expiring soon.`);

      // 3. Analyze documents with missing metadata
      const missingMetadataDocs = docs.filter((doc) => {
        return !doc.category || !doc.tags || doc.tags.length === 0 || !doc.date;
      });
      console.log(`${missingMetadataDocs.length} documents with missing metadata.`);

      // 4. Find potential duplicates (simple name check)
      const duplicateSuspects = findPotentialDuplicates(docs);
      console.log(`${duplicateSuspects} potential duplicate documents found.`);

      // 5. Calculate category distribution
      const categoryDistribution: Record<string, number> = {};
      docs.forEach((doc) => {
        const category = doc.category || "Sin categoría";
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });
      console.log("Calculated category distribution:", categoryDistribution);

      // 6. Generate recommendations based on analysis
      const recommendations: Recommendation[] = [];

      if (expiringDocs.length > 0) {
        recommendations.push({
          type: "warning",
          title: `${expiringDocs.length} documento(s) próximos a vencer`,
          description: "Tienes documentos que vencerán en los próximos 30 días.",
          actionUrl: "/dashboard/alertas", // Link to alerts page
          actionText: "Ver alertas",
        });
      }

      if (missingMetadataDocs.length > 0) {
        recommendations.push({
          type: "info",
          title: `${missingMetadataDocs.length} documento(s) con metadatos incompletos`,
          description: "Completa la información de tus documentos para mejorar la organización y búsqueda.",
          actionUrl: "/dashboard/documentos", // Link to documents list/management page
          actionText: "Ver documentos",
        });
      }

      if (duplicateSuspects > 0) {
        recommendations.push({
          type: "info",
          title: `${duplicateSuspects} posible(s) documento(s) duplicado(s)`,
          description: "Revisa tus documentos para identificar y eliminar posibles duplicados.",
          actionUrl: "/dashboard/documentos", // Link to documents list/management page
          actionText: "Ver documentos",
        });
      }

      // Add a success recommendation if no issues were found
      if (recommendations.length === 0 && totalDocuments > 0) {
        recommendations.push({
          type: "success",
          title: "¡Todo en orden!",
          description: "Tus documentos parecen estar bien organizados y actualizados.",
        });
      } else if (totalDocuments === 0) {
         recommendations.push({
          type: "info",
          title: "Empieza a subir documentos",
          description: "Sube tus primeros documentos para comenzar a organizarlos.",
           actionUrl: "/dashboard/documentos/nuevo", // Link to upload page
           actionText: "Subir documento",
        });
      }
       console.log("Generated recommendations:", recommendations);

      return {
        totalDocuments,
        expiringDocuments: expiringDocs.length,
        missingMetadata: missingMetadataDocs.length,
        duplicateSuspects,
        categoryDistribution,
        recommendations,
      };

    } catch (error) {
      console.error("Error analyzing documents:", error);
      // Return default analysis with an error recommendation
      return {
        totalDocuments: 0,
        expiringDocuments: 0,
        missingMetadata: 0,
        duplicateSuspects: 0,
        categoryDistribution: {},
        recommendations: [
          {
            type: "warning",
            title: "Error al Analizar Documentos",
            description: "No se pudo completar el análisis de tus documentos. Por favor, inténtalo de nuevo más tarde.",
          },
        ],
      };
    }
  },

  /**
   * Generates recommended alerts for documents that have an expiration date
   * but do not currently have an associated reminder in the 'document_reminders' table.
   */
  async generateRecommendedAlerts(): Promise<any[]> {
     console.log("Generating recommended alerts...");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
         console.error("generateRecommendedAlerts: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }

      const userId = userData.user.id;
      console.log(`Generating alerts for user: ${userId}`);

      // 1. Fetch documents with an expiry date in the future
      const todayISO = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("id, name, expiry_date, category") // Select only needed fields
        .eq("user_id", userId)
        .not("expiry_date", "is", null) // Must have an expiry date
        .gte("expiry_date", todayISO); // Expiry date must be today or later

      if (docsError) {
          console.error("Error fetching documents for alert generation:", docsError);
          throw docsError;
      }

      const docsWithExpiry = documents || [];
      console.log(`Found ${docsWithExpiry.length} documents with future expiry dates.`);
      if (docsWithExpiry.length === 0) return []; // No documents need alerts

      // 2. Fetch existing reminder document IDs for the user
      const { data: existingAlerts, error: alertsError } = await supabase
        .from("document_reminders") // Ensure this table name is correct
        .select("document_id") // Only need the document ID
        .eq("user_id", userId);

      if (alertsError) {
          console.error("Error fetching existing alerts:", alertsError);
          throw alertsError;
      }

      const docsWithExistingAlerts = new Set(existingAlerts?.map((alert) => alert.document_id) || []);
      console.log(`Found ${docsWithExistingAlerts.size} existing alerts.`);

      // 3. Filter documents that need alerts (have expiry, are in the future, and don't have an existing alert)
      const docsNeedingAlerts = docsWithExpiry.filter(
        (doc) => !docsWithExistingAlerts.has(doc.id)
      );
      console.log(`${docsNeedingAlerts.length} documents need recommended alerts.`);


      // 4. Generate the recommended alert objects
      const today = new Date(); today.setHours(0,0,0,0); // Normalize today

      return docsNeedingAlerts.map((doc) => {
        let expiryDate: Date;
        let diffDays = Infinity; // Default for invalid dates
        let priority = "baja"; // Default priority

        try {
            expiryDate = new Date(doc.expiry_date); expiryDate.setHours(0,0,0,0); // Normalize expiry date
            const diffTime = expiryDate.getTime() - today.getTime();
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate difference in days

            // Determine priority based on days remaining
            if (diffDays <= 7) priority = "alta";
            else if (diffDays <= 30) priority = "media";

        } catch (e) {
            console.warn(`Could not parse expiry_date '${doc.expiry_date}' for alert recommendation on doc id ${doc.id}`);
            // Keep default diffDays and priority
        }


        return {
          document_id: doc.id,
          document_name: doc.name,
          title: `Vencimiento: ${doc.name}`, // Suggested title for the alert
          date: doc.expiry_date, // The actual expiry date
          daysLeft: diffDays, // Days remaining until expiry
          priority: priority, // Calculated priority
          category: doc.category, // Document category
          // You might add default reminder settings here, e.g., remind_offset: 7 (days before)
        };
      });
    } catch (error) {
      console.error("Error generating recommended alerts:", error);
      return []; // Return empty array on error
    }
  },
};

/**
 * Helper function to find potential duplicate documents based on name similarity.
 * This is a basic implementation and might need refinement for better accuracy.
 * @param documents - Array of document objects to analyze.
 * @returns The count of potential duplicate documents (excluding the original).
 */
function findPotentialDuplicates(documents: any[]): number {
  let duplicateCount = 0;
  const nameMap: Record<string, any[]> = {}; // Map to store documents grouped by normalized name

  // Group documents by normalized name (lowercase, trimmed)
  documents.forEach((doc) => {
    if (!doc.name) return; // Skip documents without a name
    const normalizedName = doc.name.toLowerCase().trim();
    if (!nameMap[normalizedName]) {
      nameMap[normalizedName] = [];
    }
    nameMap[normalizedName].push(doc);
  });

  // Count groups with more than one document (potential duplicates)
  Object.values(nameMap).forEach((group) => {
    if (group.length > 1) {
      // Add the number of duplicates (group size minus the original)
      duplicateCount += group.length - 1;
    }
  });

  return duplicateCount;
}
