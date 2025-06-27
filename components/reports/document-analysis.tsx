// components/reports/document-analysis.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type DocumentAnalysis, type Recommendation } from "@/lib/analysis-helpers";

// 1. Definimos las props que el componente espera recibir.
//    Espera un único objeto 'analysis'.
export interface DocumentAnalysisProps {
  analysis: DocumentAnalysis | null;
}

// 2. Usamos las props y las desestructuramos para un uso más fácil.
export function DocumentAnalysisComponent({ analysis }: DocumentAnalysisProps) {
  const router = useRouter();

  // 3. Manejamos el caso de que el análisis aún no esté disponible.
  if (!analysis) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Cargando análisis...</span>
      </div>
    );
  }

  const {
    totalDocuments,
    expiringDocuments,
    missingMetadata,
    duplicateSuspects,
    recommendations,
    categoryDistribution,
  } = analysis;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentos analizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Total de documentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximos a vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringDocuments}</div>
            <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metadatos incompletos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missingMetadata}</div>
            <p className="text-xs text-muted-foreground">Documentos por completar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posibles duplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicateSuspects}</div>
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
          {recommendations.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No hay recomendaciones disponibles</div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.type === "warning" ? "bg-destructive/10 border-destructive/30" :
                    rec.type === "info" ? "bg-blue-500/10 border-blue-500/30" :
                    "bg-success/10 border-success/30"
                  }`}
                >
                  <h3 className={`font-medium ${
                    rec.type === "warning" ? "text-destructive" :
                    rec.type === "info" ? "text-blue-500" :
                    "text-success"
                  }`}>{rec.title}</h3>
                  <p className="text-sm mt-1">{rec.description}</p>
                  {rec.actionUrl && (
                    <Button
                      variant="link"
                      className={`p-0 h-auto mt-2 ${
                        rec.type === "warning" ? "text-destructive" :
                        rec.type === "info" ? "text-blue-500" :
                        "text-success"
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
          {Object.keys(categoryDistribution || {}).length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No hay datos de categorías disponibles</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryDistribution || {}).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(count / totalDocuments) * 100}%` }}
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
    </>
  );
}