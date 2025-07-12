'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HealthReportTemplate } from '@/components/reports/health-report-template'
import { Loader2 } from 'lucide-react'

// Este componente cliente se encarga de leer los datos de la URL y renderizar el reporte
function ReportView() {
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const encodedData = searchParams.get('data')
    if (encodedData) {
      try {
        // Decodificamos los datos que vienen en la URL (en base64)
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8')
        setReportData(JSON.parse(decodedData))
      } catch (e) {
        console.error("Error al decodificar los datos del reporte:", e)
        setError("No se pudieron cargar los datos del reporte.")
      }
    } else {
        setError("No se encontraron datos para generar el reporte.")
    }
  }, [searchParams])

  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>
  }

  // Muestra un indicador de carga mientras se decodifican los datos
  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Cargando datos del reporte...</p>
      </div>
    )
  }

  // Una vez que los datos están listos, se los pasamos a la plantilla visual
  return <HealthReportTemplate data={reportData} />
}

export default function HealthSummaryPreviewPage() {
  // Envolvemos el componente para que use Suspense si es necesario en el futuro
  return <ReportView />
}
