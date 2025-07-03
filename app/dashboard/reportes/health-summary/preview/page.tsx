// app/dashboard/reports/health-summary/preview/page.tsx
'use client' // Lo hacemos un Client Component para leer los searchParams fácilmente

import { HealthReportTemplate } from "@/components/reports/health-report-template";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Componente para manejar el renderizado del lado del cliente
function ReportView() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const encodedData = searchParams.get('data');
    if (encodedData) {
      try {
        // Decodificamos los datos de la URL
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        const parsedData = JSON.parse(decodedData);
        setReportData(parsedData);
      } catch (error) {
        console.error("Error decoding report data:", error);
      }
    }
  }, [searchParams]);

  if (!reportData) {
    // Muestra un estado de carga o un mensaje de error si los datos no se pueden decodificar
    return <div>Cargando datos del reporte...</div>;
  }

  return <HealthReportTemplate data={reportData} />;
}


export default function HealthSummaryPreviewPage() {
  // Envolvemos el componente para poder usar el hook Suspense de ser necesario
  return <ReportView />;
}