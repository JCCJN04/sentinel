//startup\app\dashboard\reportes\page.tsx
// REMOVED: "use client" - This file is now a Server Component

import { reportsService, type DocumentStats, type CategoryCount } from "@/lib/reports-service"
import { documentAnalysisService, type DocumentAnalysis } from "@/lib/document-analysis-service"
// UPDATED: Import path for the client component
import ReportesClientContent from './ReportesClientContent';
export default async function ReportesPage() {
  const currentYear = new Date().getFullYear().toString();

  // Fetch all initial data on the server
  const initialStats: DocumentStats = await reportsService.getDocumentStats(currentYear);
  const initialCategoryData: CategoryCount[] = await reportsService.getDocumentsByCategory(currentYear);
  const initialAnalysis: DocumentAnalysis = await documentAnalysisService.analyzeDocuments();

  return (
    <ReportesClientContent
      initialStats={initialStats}
      initialCategoryData={initialCategoryData}
      initialAnalysis={initialAnalysis}
      initialYear={currentYear}
    />
  );
}