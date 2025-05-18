"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExpenseChart } from "@/components/reports/expense-chart"
import { DocumentsByCategory } from "@/components/reports/documents-by-category"
import { DocumentsByMonth } from "@/components/reports/documents-by-month"
import { DocumentsTable } from "@/components/reports/documents-table"
import { FileDown, Filter, Loader2 } from "lucide-react"
import { reportsService, formatFileSize, type DocumentStats } from "@/lib/reports-service"
import { documentAnalysisService, type DocumentAnalysis } from "@/lib/document-analysis-service"
import { useRouter } from "next/navigation"
import { DocumentAnalysisComponent } from "@/components/reports/document-analysis"

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const data = await reportsService.getDocumentStats(selectedYear)
        setStats(data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedYear])

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true)
      try {
        const data = await documentAnalysisService.analyzeDocuments()
        setAnalysis(data)
      } catch (error) {
        console.error("Error al cargar análisis:", error)
      } finally {
        setLoadingAnalysis(false)
      }
    }

    fetchAnalysis()
  }, [])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleExport = () => {
    // Implementación futura: exportar datos a CSV/PDF
    alert("Funcionalidad de exportación en desarrollo")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h1>
        <p className="text-muted-foreground">Visualiza estadísticas y genera reportes sobre tus documentos.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="analisis">Análisis</TabsTrigger>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
            <TabsTrigger value="salud">Salud</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>

            <Button onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats?.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "Cargando..." : `+${stats?.recentDocuments} en los últimos 7 días`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Documentos por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats?.categoriesCount}</div>
                <p className="text-xs text-muted-foreground">Categorías activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Documentos próximos a vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats?.expiringDocuments}</div>
                <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Espacio utilizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : formatFileSize(stats?.storageUsed || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  De {formatFileSize(stats?.storageLimit || 0)} disponibles
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Documentos por categoría</CardTitle>
                <CardDescription>Distribución de documentos según su categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentsByCategory year={selectedYear} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentos por mes</CardTitle>
                <CardDescription>Cantidad de documentos añadidos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentsByMonth year={selectedYear} />
              </CardContent>
            </Card>
          </div>

          <DocumentAnalysisComponent year={selectedYear} />

          <Card>
            <CardHeader>
              <CardTitle>Documentos recientes</CardTitle>
              <CardDescription>Los últimos documentos añadidos a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsTable year={selectedYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gastos totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,245.89</div>
                <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gastos promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$415.30</div>
                <p className="text-xs text-muted-foreground">Por mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mayor gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$520.00</div>
                <p className="text-xs text-muted-foreground">Hipoteca - Marzo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Facturas pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Total: $145.50</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gastos mensuales</CardTitle>
              <CardDescription>Evolución de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ExpenseChart year={selectedYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicios">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Análisis de servicios en desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="salud">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Reportes de salud en desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="analisis" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Documentos analizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingAnalysis ? "..." : analysis?.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">Total de documentos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingAnalysis ? "..." : analysis?.expiringDocuments}</div>
                <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Metadatos incompletos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingAnalysis ? "..." : analysis?.missingMetadata}</div>
                <p className="text-xs text-muted-foreground">Documentos por completar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Posibles duplicados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingAnalysis ? "..." : analysis?.duplicateSuspects}</div>
                <p className="text-xs text-muted-foreground">Documentos a revisar</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones</CardTitle>
              <CardDescription>Sugerencias basadas en el análisis de tus documentos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalysis ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Analizando documentos...</span>
                </div>
              ) : analysis?.recommendations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No hay recomendaciones disponibles</div>
              ) : (
                <div className="space-y-4">
                  {analysis?.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        rec.type === "warning"
                          ? "bg-destructive/10 border-destructive/30"
                          : rec.type === "info"
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-success/10 border-success/30"
                      }`}
                    >
                      <h3
                        className={`font-medium ${
                          rec.type === "warning"
                            ? "text-destructive"
                            : rec.type === "info"
                              ? "text-blue-500"
                              : "text-success"
                        }`}
                      >
                        {rec.title}
                      </h3>
                      <p className="text-sm mt-1">{rec.description}</p>
                      {rec.actionUrl && (
                        <Button
                          variant="link"
                          className={`p-0 h-auto mt-2 ${
                            rec.type === "warning"
                              ? "text-destructive"
                              : rec.type === "info"
                                ? "text-blue-500"
                                : "text-success"
                          }`}
                          onClick={() => router.push(rec.actionUrl!)}
                        >
                          {rec.actionText}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por categoría</CardTitle>
              <CardDescription>Análisis de la organización de tus documentos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalysis ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Cargando distribución...</span>
                </div>
              ) : Object.keys(analysis?.categoryDistribution || {}).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No hay datos de categorías disponibles</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analysis?.categoryDistribution || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
