// app/dashboard/reportes/reportes-client-content.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseChart } from "@/components/reports/expense-chart";
import { DocumentsByCategory } from "@/components/reports/documents-by-category";
import { DocumentsByMonth } from "@/components/reports/documents-by-month";
import { DocumentsTable } from "@/components/reports/documents-table";
import { FileDown, Filter, Loader2 } from "lucide-react";
import { DocumentAnalysisComponent } from "@/components/reports/document-analysis";

import { getDocumentStats, getDocumentsByCategory } from "@/lib/reports-actions";
import { formatFileSize, type DocumentStats, type CategoryCount } from "@/lib/reports-helpers";
import { type DocumentAnalysis } from "@/lib/analysis-helpers";

interface ReportesClientContentProps {
  initialStats: DocumentStats;
  initialCategoryData: CategoryCount[];
  initialAnalysis: DocumentAnalysis;
  initialYear: string;
}

export default function ReportesClientContent({
  initialStats,
  initialCategoryData,
  initialAnalysis,
  initialYear,
}: ReportesClientContentProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [stats, setStats] = useState<DocumentStats>(initialStats);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>(initialCategoryData);
  const [analysis, setAnalysis] = useState<DocumentAnalysis>(initialAnalysis);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedYear === initialYear) {
      setStats(initialStats);
      setCategoryData(initialCategoryData);
      return;
    }

    const fetchNewYearData = async () => {
      setLoading(true);
      const [newStats, newCategoryData] = await Promise.all([
        getDocumentStats(selectedYear),
        getDocumentsByCategory(selectedYear),
      ]);
      setStats(newStats);
      setCategoryData(newCategoryData);
      setLoading(false);
    };

    fetchNewYearData();
  }, [selectedYear, initialYear, initialStats, initialCategoryData]);

  const handleYearChange = (year: string) => setSelectedYear(year);
  const handleTabChange = (value: string) => setActiveTab(value);
  const handleExport = () => alert("Funcionalidad de exportación en desarrollo");

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
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Año" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Filter className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de documentos</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.totalDocuments}</div>}
                <p className="text-xs text-muted-foreground">{loading ? "..." : `+${stats.recentDocuments} en los últimos 7 días`}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Categorías</CardTitle></CardHeader>
              <CardContent>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.categoriesCount}</div>}
                  <p className="text-xs text-muted-foreground">Categorías activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle></CardHeader>
              <CardContent>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{stats.expiringDocuments}</div>}
                  <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Espacio utilizado</CardTitle></CardHeader>
              <CardContent>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</div>}
                  <p className="text-xs text-muted-foreground">De {formatFileSize(stats.storageLimit)}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Documentos por categoría</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : <DocumentsByCategory data={categoryData} year={selectedYear} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Documentos por mes</CardTitle></CardHeader>
              <CardContent><DocumentsByMonth year={selectedYear} /></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Documentos recientes</CardTitle></CardHeader>
            <CardContent><DocumentsTable year={selectedYear} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Gastos Mensuales</CardTitle></CardHeader>
                <CardContent className="h-[400px]"><ExpenseChart year={selectedYear} /></CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="analisis" className="space-y-6">
          {/* AHORA LA LLAMADA ES CORRECTA PORQUE EL COMPONENTE HIJO ESTÁ BIEN DEFINIDO */}
          <DocumentAnalysisComponent analysis={analysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}