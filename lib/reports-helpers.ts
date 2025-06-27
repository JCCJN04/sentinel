// lib/reports-helpers.ts
// ESTE ARCHIVO NO LLEVA 'use server'

// --- Interfaces y Tipos ---
export interface DocumentStats {
    totalDocuments: number;
    categoriesCount: number;
    expiringDocuments: number;
    storageUsed: number;
    storageLimit: number;
    recentDocuments: number;
}

export interface CategoryCount {
    name: string;
    value: number;
    color: string;
}

export interface MonthlyCount {
    name: string;
    documentos: number;
}

export interface ExpenseData {
    name: string;
    [key: string]: string | number;
}

export interface ExpenseDocumentData {
    id: string;
    category: string | null;
    amount: string | null;
    currency: string | null;
    date: string | null;
}

// --- Colores y Funciones de Ayuda (Helpers) ---
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
    "Servicios": "#20c997",
    "Sin categoría": "#6c757d",
    Otros: "#adb5bd",
};

export function getCategoryColor(category: string): string {
    return categoryColors[category] || categoryColors["Sin categoría"];
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes < 0) bytes = 0;
    const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
}