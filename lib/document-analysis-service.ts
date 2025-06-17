// startup_clonada/lib/document-analysis-service.ts

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
 * Service class for analyzing user documents and interacting with AI.
 * Assumes these methods are called from a client-side context.
 */
export class DocumentAnalysisService {
  private openRouterApiKey: string;

  constructor() {
    // Safely get the API key from environment variables
    this.openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (!this.openRouterApiKey) {
      console.error('OpenRouter API key is not set in environment variables.');
    }
  }

  /**
   * Analyzes documents for the currently authenticated user.
   * Provides statistics and recommendations based on the analysis.
   */
  async analyzeDocuments(): Promise<DocumentAnalysis> {
    console.log("Starting document analysis...");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("analyzeDocuments: User not authenticated.", userError);
        throw new Error("User not authenticated");
      }

      const userId = userData.user.id;
      console.log(`Analyzing documents for user: ${userId}`);

      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("id, name, category, tags, date, expiry_date")
        .eq("user_id", userId);

      if (docsError) {
        console.error("Error fetching documents for analysis:", docsError);
        throw docsError;
      }

      const docs = documents || [];
      const totalDocuments = docs.length;
      console.log(`Fetched ${totalDocuments} documents.`);

      // --- Analysis Logic (expiring, metadata, duplicates, etc.) ---

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

      const missingMetadataDocs = docs.filter((doc) => !doc.category || !doc.tags || doc.tags.length === 0 || !doc.date);
      console.log(`${missingMetadataDocs.length} documents with missing metadata.`);

      const duplicateSuspects = this.findPotentialDuplicates(docs);
      console.log(`${duplicateSuspects} potential duplicate documents found.`);

      const categoryDistribution: Record<string, number> = {};
      docs.forEach((doc) => {
        const category = doc.category || "Sin categoría";
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });
      console.log("Calculated category distribution:", categoryDistribution);

      const recommendations = this.generateRecommendations(expiringDocs.length, missingMetadataDocs.length, duplicateSuspects, totalDocuments);
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
            description: "No se pudo completar el análisis. Inténtalo de nuevo más tarde.",
          },
        ],
      };
    }
  }

  /**
   * Gets a response from the AI assistant based on a user's question and their documents.
   * @param question The user's question.
   * @param documents A list of the user's documents to provide as context.
   */
  async getAIChatResponse(question: string, documents: any[]): Promise<string> {
    if (!this.openRouterApiKey) {
      return "Error: La clave de API para el asistente de IA no está configurada.";
    }
    if (!question.trim()) {
        return "Por favor, escribe una pregunta para el asistente.";
    }

    // Format the document list into a simple string for the AI context
    const documentsContext = documents.map(doc =>
      `- Nombre: ${doc.name}, Categoría: ${doc.category || 'N/A'}, Fecha de Vencimiento: ${doc.expiry_date || 'N/A'}`
    ).join('\n');

    const systemPrompt = `Eres un asistente experto en gestión de documentos. Tu única fuente de conocimiento son los documentos del usuario que se listan a continuación. Responde a la pregunta del usuario de forma concisa y basándote únicamente en esta información. No inventes datos. Si la respuesta no está en la lista, indica que no tienes la información.

Documentos del usuario:
${documentsContext}`;

    console.log("Sending prompt to AI for chat response...");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openRouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.1-8b-instruct:free",
          "messages": [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": question }
          ]
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }

      const jsonResponse = await response.json();
      const answer = jsonResponse.choices[0]?.message?.content;

      if (!answer) {
        throw new Error("Failed to extract answer from AI response.");
      }

      return answer.trim();
    } catch (error) {
      console.error('Error getting AI chat response:', error);
      return `Lo siento, no pude procesar tu pregunta en este momento. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Generates recommended alerts for documents that have an expiration date
   * but do not currently have an associated reminder.
   */
  async generateRecommendedAlerts(): Promise<any[]> {
    console.log("Generating recommended alerts...");
    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("User not authenticated");

        const userId = userData.user.id;
        const todayISO = new Date().toISOString().split('T')[0];

        // Fetch documents with a future expiry date
        const { data: documents, error: docsError } = await supabase
            .from("documents")
            .select("id, name, expiry_date, category")
            .eq("user_id", userId)
            .not("expiry_date", "is", null)
            .gte("expiry_date", todayISO);
        if (docsError) throw docsError;

        const docsWithExpiry = documents || [];
        if (docsWithExpiry.length === 0) return [];

        // Fetch existing reminders to avoid duplicates
        const { data: existingAlerts, error: alertsError } = await supabase
            .from("document_reminders")
            .select("document_id")
            .eq("user_id", userId);
        if (alertsError) throw alertsError;

        const docsWithExistingAlerts = new Set(existingAlerts?.map(a => a.document_id) || []);

        const docsNeedingAlerts = docsWithExpiry.filter(doc => !docsWithExistingAlerts.has(doc.id));
        console.log(`${docsNeedingAlerts.length} documents need recommended alerts.`);

        // Generate alert objects
        const today = new Date(); today.setHours(0,0,0,0);
        return docsNeedingAlerts.map(doc => {
            let diffDays = Infinity, priority = 'baja';
            try {
                const expiryDate = new Date(doc.expiry_date); expiryDate.setHours(0,0,0,0);
                diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) priority = 'alta';
                else if (diffDays <= 30) priority = 'media';
            } catch (e) {
                console.warn(`Could not parse expiry_date '${doc.expiry_date}' for alert on doc id ${doc.id}`);
            }

            return {
                document_id: doc.id,
                document_name: doc.name,
                title: `Vencimiento: ${doc.name}`,
                date: doc.expiry_date,
                daysLeft: diffDays,
                priority: priority,
                category: doc.category,
            };
        });
    } catch (error) {
        console.error("Error generating recommended alerts:", error);
        return [];
    }
  }

  /**
   * Helper function to find potential duplicate documents based on name similarity.
   */
  private findPotentialDuplicates(documents: any[]): number {
    let duplicateCount = 0;
    const nameMap: Record<string, any[]> = {};

    documents.forEach((doc) => {
      if (!doc.name) return;
      const normalizedName = doc.name.toLowerCase().trim();
      if (!nameMap[normalizedName]) nameMap[normalizedName] = [];
      nameMap[normalizedName].push(doc);
    });

    Object.values(nameMap).forEach((group) => {
      if (group.length > 1) {
        duplicateCount += group.length - 1;
      }
    });

    return duplicateCount;
  }

  /**
   * Helper function to generate recommendations based on analysis results.
   */
  private generateRecommendations(expiringCount: number, missingMetaCount: number, duplicateCount: number, totalDocs: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (expiringCount > 0) {
      recommendations.push({
        type: "warning",
        title: `${expiringCount} documento(s) próximos a vencer`,
        description: "Tienes documentos que vencerán en los próximos 30 días.",
        actionUrl: "/dashboard/alertas",
        actionText: "Ver alertas",
      });
    }
    if (missingMetaCount > 0) {
      recommendations.push({
        type: "info",
        title: `${missingMetaCount} documento(s) con metadatos incompletos`,
        description: "Completa la información para mejorar la organización.",
        actionUrl: "/dashboard/documentos",
        actionText: "Ver documentos",
      });
    }
    if (duplicateCount > 0) {
      recommendations.push({
        type: "info",
        title: `${duplicateCount} posible(s) duplicado(s)`,
        description: "Revisa tus documentos para eliminar duplicados.",
        actionUrl: "/dashboard/documentos",
        actionText: "Ver documentos",
      });
    }

    if (recommendations.length === 0 && totalDocs > 0) {
      recommendations.push({ type: "success", title: "¡Todo en orden!", description: "Tus documentos están organizados y actualizados." });
    } else if (totalDocs === 0) {
      recommendations.push({ type: "info", title: "Empieza a subir documentos", description: "Sube tus primeros documentos para comenzar.", actionUrl: "/dashboard/subir", actionText: "Subir documento" });
    }

    return recommendations;
  }
}

// Export a singleton instance of the service
export const documentAnalysisService = new DocumentAnalysisService();