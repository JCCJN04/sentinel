// lib/analysis-actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { DocumentAnalysis, Recommendation } from "./analysis-helpers";
import { findPotentialDuplicates, generateRecommendations } from "./analysis-helpers";

// La API Key se lee de forma segura desde las variables de entorno del SERVIDOR
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

export async function analyzeDocuments(): Promise<DocumentAnalysis> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    console.log("ACTION: Analyzing documents...");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: documents, error } = await supabase.from("documents").select("id, name, category, tags, date, expiry_date").eq("user_id", user.id);
        if (error) throw error;

        const docs = documents || [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const thirtyDaysLater = new Date(today); thirtyDaysLater.setDate(today.getDate() + 30);

        const expiringDocs = docs.filter(doc => {
            if (!doc.expiry_date) return false;
            try {
                const expiryDate = new Date(doc.expiry_date);
                return expiryDate <= thirtyDaysLater && expiryDate >= today;
            } catch { return false; }
        });

        const missingMetadataDocs = docs.filter(doc => !doc.category || !doc.tags || doc.tags.length === 0 || !doc.date);
        const duplicateSuspects = findPotentialDuplicates(docs);
        
        const categoryDistribution: Record<string, number> = {};
        docs.forEach(doc => {
            const category = doc.category || "Sin categoría";
            categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
        });

        const recommendations = generateRecommendations(expiringDocs.length, missingMetadataDocs.length, duplicateSuspects, docs.length);

        return {
            totalDocuments: docs.length,
            expiringDocuments: expiringDocs.length,
            missingMetadata: missingMetadataDocs.length,
            duplicateSuspects,
            categoryDistribution,
            recommendations,
        };
    } catch (error) {
        console.error("Error analyzing documents:", error);
        return { totalDocuments: 0, expiringDocuments: 0, missingMetadata: 0, duplicateSuspects: 0, categoryDistribution: {}, recommendations: [{ type: "warning", title: "Error al Analizar", description: "No se pudo completar el análisis." }]};
    }
}

export async function getAIChatResponse(question: string, documents: any[]): Promise<string> {
    if (!openRouterApiKey) {
        return "Error: La clave de API para el asistente de IA no está configurada.";
    }
    if (!question.trim()) {
        return "Por favor, escribe una pregunta para el asistente.";
    }

    const documentsContext = documents.map(doc => `- Nombre: ${doc.name}, Cat: ${doc.category || 'N/A'}, Vence: ${doc.expiry_date || 'N/A'}`).join('\n');
    const systemPrompt = `Eres un asistente experto en gestión de documentos. Tu única fuente de conocimiento son los documentos del usuario. Responde a su pregunta de forma concisa y basándote únicamente en esta información. Si la respuesta no está, indica que no tienes la información.\n\nDocumentos:\n${documentsContext}`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${openRouterApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": question }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const jsonResponse = await response.json();
        return jsonResponse.choices[0]?.message?.content.trim() || "No se recibió respuesta.";
    } catch (error) {
        console.error('Error getting AI chat response:', error);
        return `Lo siento, no pude procesar tu pregunta. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

export async function generateRecommendedAlerts(): Promise<any[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    console.log("ACTION: Generating recommended alerts...");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const todayISO = new Date().toISOString().split('T')[0];
        
        const { data: documents, error: docsError } = await supabase.from("documents").select("id, name, expiry_date, category").eq("user_id", user.id).not("expiry_date", "is", null).gte("expiry_date", todayISO);
        if (docsError) throw docsError;

        const { data: existingAlerts, error: alertsError } = await supabase.from("document_reminders").select("document_id").eq("user_id", user.id);
        if (alertsError) throw alertsError;

        const docsWithExistingAlerts = new Set(existingAlerts?.map(a => a.document_id) || []);
        const docsNeedingAlerts = (documents || []).filter(doc => !docsWithExistingAlerts.has(doc.id));
        
        const today = new Date(); today.setHours(0,0,0,0);
        return docsNeedingAlerts.map(doc => {
            let diffDays = Infinity, priority = 'baja';
            try {
                const expiryDate = new Date(doc.expiry_date); expiryDate.setHours(0,0,0,0);
                diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) priority = 'alta'; else if (diffDays <= 30) priority = 'media';
            } catch {}
            
            return { document_id: doc.id, document_name: doc.name, title: `Vencimiento: ${doc.name}`, date: doc.expiry_date, daysLeft: diffDays, priority, category: doc.category };
        });
    } catch (error) {
        console.error("Error generating recommended alerts:", error);
        return [];
    }
}