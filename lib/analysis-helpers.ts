// lib/analysis-helpers.ts
// ESTE ARCHIVO NO LLEVA 'use server'

// --- Interfaces y Tipos ---
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

// --- Funciones de Ayuda (Helpers) ---

export function findPotentialDuplicates(documents: any[]): number {
    let duplicateCount = 0;
    const nameMap: Record<string, any[]> = {};

    documents.forEach((doc) => {
        if (!doc.name) return;
        const normalizedName = doc.name.toLowerCase().trim();
        if (!nameMap[normalizedName]) {
            nameMap[normalizedName] = [];
        }
        nameMap[normalizedName].push(doc);
    });

    Object.values(nameMap).forEach((group) => {
        if (group.length > 1) {
            duplicateCount += group.length - 1;
        }
    });

    return duplicateCount;
}

export function generateRecommendations(expiringCount: number, missingMetaCount: number, duplicateCount: number, totalDocs: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (expiringCount > 0) {
        recommendations.push({ type: "warning", title: `${expiringCount} documento(s) próximos a vencer`, description: "Tienes documentos que vencerán en los próximos 30 días.", actionUrl: "/dashboard/alertas", actionText: "Ver alertas" });
    }
    if (missingMetaCount > 0) {
        recommendations.push({ type: "info", title: `${missingMetaCount} documento(s) con metadatos incompletos`, description: "Completa la información para mejorar la organización.", actionUrl: "/dashboard/documentos", actionText: "Ver documentos" });
    }
    if (duplicateCount > 0) {
        recommendations.push({ type: "info", title: `${duplicateCount} posible(s) duplicado(s)`, description: "Revisa tus documentos para eliminar duplicados.", actionUrl: "/dashboard/documentos", actionText: "Ver documentos" });
    }
    if (recommendations.length === 0 && totalDocs > 0) {
        recommendations.push({ type: "success", title: "¡Todo en orden!", description: "Tus documentos están organizados y actualizados." });
    } else if (totalDocs === 0) {
        recommendations.push({ type: "info", title: "Empieza a subir documentos", description: "Sube tus primeros documentos para comenzar.", actionUrl: "/dashboard/subir", actionText: "Subir documento" });
    }

    return recommendations;
}