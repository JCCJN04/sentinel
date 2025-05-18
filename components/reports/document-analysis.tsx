"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info, CheckCircle, ArrowRight } from "lucide-react"
import { documentAnalysisService, type DocumentAnalysis } from "@/lib/document-analysis-service"
import { useRouter } from "next/navigation"

interface DocumentAnalysisProps {
  year?: string
}

export function DocumentAnalysisComponent({ year }: DocumentAnalysisProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("recomendaciones")
  const router = useRouter()

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true)
      try {
        const data = await documentAnalysisService.analyzeDocuments()
        setAnalysis(data)
      } catch (error) {
        console.error("Error al cargar análisis:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [year])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "info":
        return <Info className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "destructive"
      case "info":
        return "default"
      case "success":
        return "success"
      default:
        return "default"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de documentos</CardTitle>
        <CardDescription>Información y recomendaciones basadas en tus documentos</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="recomendaciones" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Analizando documentos...</span>
              </div>
            ) : analysis?.recommendations.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No hay recomendaciones disponibles</div>
            ) : (
              <div className="space-y-4">
                {analysis?.recommendations.map((rec, index) => (
                  <Alert key={index} variant={getAlertVariant(rec.type) as any}>
                    {getAlertIcon(rec.type)}
                    <AlertTitle>{rec.title}</AlertTitle>
                    <AlertDescription>
                      <p>{rec.description}</p>
                      {rec.actionUrl && (
                        <Button variant="link" className="p-0 h-auto mt-2" onClick={() => router.push(rec.actionUrl!)}>
                          {rec.actionText} <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="estadisticas">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Cargando estadísticas...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Documentos analizados</h3>
                    <p className="text-2xl font-bold">{analysis?.totalDocuments}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Próximos a vencer</h3>
                    <p className="text-2xl font-bold">{analysis?.expiringDocuments}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Metadatos incompletos</h3>
                    <p className="text-2xl font-bold">{analysis?.missingMetadata}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Posibles duplicados</h3>
                    <p className="text-2xl font-bold">{analysis?.duplicateSuspects}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Distribución por categoría</h3>
                  <div className="space-y-3">
                    {Object.entries(analysis?.categoryDistribution || {}).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span>{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(count / analysis!.totalDocuments) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
