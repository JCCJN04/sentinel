// app/dashboard/reportes/page.tsx

import ReportesClientContent from './reportes-client-content';
import { getDocumentStats, getDocumentsByCategory } from '@/lib/reports-actions';
import { analyzeDocuments } from '@/lib/analysis-actions';

/**
 * Página de Reportes (Componente de Servidor).
 * - Obtiene los datos iniciales de forma asíncrona en el servidor.
 * - Usa Promise.all para cargar datos en paralelo y mejorar la velocidad.
 * - Pasa los datos al componente `ReportesClientContent` para la renderización y la interactividad.
 */
export default async function ReportesPage() {
  const currentYear = new Date().getFullYear().toString();

  // Obtenemos todos los datos iniciales en paralelo para optimizar la carga.
  const [initialStats, initialCategoryData, initialAnalysis] = await Promise.all([
    getDocumentStats(currentYear),
    getDocumentsByCategory(currentYear),
    analyzeDocuments(),
  ]);

  return (
    <ReportesClientContent
      initialStats={initialStats}
      initialCategoryData={initialCategoryData}
      initialAnalysis={initialAnalysis}
      initialYear={currentYear}
    />
  );
}