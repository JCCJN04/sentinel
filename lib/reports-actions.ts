// lib/reports-actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
// import { cookies } from "next/headers"; // Ya no se necesita
import { getCategoryColor } from "./reports-helpers";
import type { CategoryCount, DocumentStats, MonthlyCount, ExpenseData, ExpenseDocumentData } from './reports-helpers';

export async function getDocumentStats(year?: string): Promise<DocumentStats> {
  // const cookieStore = cookies(); // <-- LÍNEA ELIMINADA
  const supabase = createClient(); // <-- LÍNEA CORREGIDA
  console.log(`ACTION: Fetching stats for year ${year}`);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let baseQuery = supabase.from("documents").select('file_type, category').eq("user_id", user.id);
    let countQuery = supabase.from("documents").select('*', { count: "exact", head: true }).eq("user_id", user.id);

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31T23:59:59.999Z`;
      baseQuery = baseQuery.gte("date", startDate).lte("date", endDate);
      countQuery = countQuery.gte("date", startDate).lte("date", endDate);
    }

    const [
      totalResult,
      recentResult,
      expiringResult,
      allDocsResult,
    ] = await Promise.all([
      countQuery,
      supabase.from("documents").select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("documents").select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'próximo a vencer'),
      baseQuery
    ]);

    if (totalResult.error) throw totalResult.error;
    if (recentResult.error) throw recentResult.error;
    if (expiringResult.error) throw expiringResult.error;
    if (allDocsResult.error) throw allDocsResult.error;

    const allDocs = allDocsResult.data || [];
    const uniqueCategories = new Set(allDocs.map(doc => doc.category || "Sin categoría"));

    let estimatedStorageBytes = 0;
    allDocs.forEach(doc => {
      switch (doc.file_type?.toLowerCase()) {
        case "pdf": estimatedStorageBytes += 2097152; break;
        case "jpg": case "jpeg": case "png": estimatedStorageBytes += 1572864; break;
        default: estimatedStorageBytes += 512000;
      }
    });

    return {
      totalDocuments: totalResult.count ?? 0,
      categoriesCount: uniqueCategories.size,
      recentDocuments: recentResult.count ?? 0,
      storageUsed: estimatedStorageBytes,
      storageLimit: 5368709120, // 5GB
      expiringDocuments: expiringResult.count ?? 0,
    };
  } catch (error) {
    console.error("Error in getDocumentStats:", error);
    return { totalDocuments: 0, categoriesCount: 0, recentDocuments: 0, storageUsed: 0, storageLimit: 5368709120, expiringDocuments: 0 };
  }
}

export async function getDocumentsByCategory(year?: string): Promise<CategoryCount[]> {
    const supabase = createClient(); // <-- LÍNEA CORREGIDA
    console.log(`ACTION: Fetching categories for year ${year}`);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        let query = supabase.from("documents").select("category").eq("user_id", user.id);

        if (year) {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31T23:59:59.999Z`;
            query = query.gte("date", startDate).lte("date", endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const categoryCounts: Record<string, number> = {};
        (data || []).forEach(doc => {
            const category = doc.category || "Sin categoría";
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        return Object.entries(categoryCounts).map(([name, value]) => ({
            name,
            value,
            color: getCategoryColor(name),
        }));
    } catch (error) {
        console.error("Error getting documents by category:", error);
        return [];
    }
}

export async function getDocumentsByMonth(year: string): Promise<MonthlyCount[]> {
    const supabase = createClient(); // <-- LÍNEA CORREGIDA
    console.log(`ACTION: Fetching documents by month for year ${year}...`);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const startDate = `${year}-01-01T00:00:00.000Z`;
        const endDate = `${year}-12-31T23:59:59.999Z`;

        const { data, error } = await supabase
            .from("documents")
            .select("created_at")
            .eq("user_id", user.id)
            .gte("created_at", startDate)
            .lte("created_at", endDate);

        if (error) throw error;

        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const monthlyCounts: Record<string, number> = monthNames.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

        (data || []).forEach(doc => {
            if (doc.created_at) {
                const date = new Date(doc.created_at);
                const month = monthNames[date.getMonth()];
                monthlyCounts[month]++;
            }
        });

        return monthNames.map(name => ({ name, documentos: monthlyCounts[name] }));
    } catch (error) {
        console.error("Error getting documents by month:", error);
        return [];
    }
}

export async function getExpensesByMonth(year: string): Promise<ExpenseData[]> {
    const supabase = createClient(); // <-- LÍNEA CORREGIDA
    console.log(`ACTION: Fetching expenses by month for year ${year}...`);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data, error } = await supabase
            .from("documents")
            .select("id, category, amount, currency, date")
            .eq("user_id", user.id)
            .gte("date", startDate)
            .lte("date", endDate)
            .not("amount", "is", null);

        if (error) throw error;
        
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const expenseCategories = ["Hogar", "Servicios", "Transporte", "Alimentación", "Entretenimiento", "Otros"];
        const result: ExpenseData[] = monthNames.map(name => ({
            name,
            ...expenseCategories.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as Record<string, number>)
        }));

        (data || []).forEach((doc: ExpenseDocumentData) => {
            if (!doc.amount || !doc.date) return;

            try {
                const amountValue = Number.parseFloat(doc.amount);
                const dateValue = new Date(doc.date);
                if (isNaN(amountValue) || isNaN(dateValue.getTime())) return;
                
                const monthIndex = dateValue.getMonth();
                const docCategory = doc.category || "";
                let mappedCategory = expenseCategories.includes(docCategory) ? docCategory : "Otros";

                if (monthIndex >= 0 && monthIndex < 12 && typeof result[monthIndex][mappedCategory] === 'number') {
                    result[monthIndex][mappedCategory] = (result[monthIndex][mappedCategory] as number) + amountValue;
                }
            } catch (e) {
                console.warn(`Could not parse expense document: id=${doc.id}`, e);
            }
        });

        return result;
    } catch (error) {
        console.error("Error getting expenses by month:", error);
        return [];
    }
}