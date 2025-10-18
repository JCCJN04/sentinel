'use client'

import { useMemo } from 'react'
import { BarChart3, Calendar, Folder, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface DocumentInsightData {
  id: string
  name: string
  category?: string | null
  expiry_date?: string | null
  created_at?: string
  file_size?: number
}

interface DocumentInsightConfig {
  documents: DocumentInsightData[]
  className?: string
}

interface DocumentStats {
  totalDocuments: number
  totalSize: number
  categoriesCount: number
  expiringCount: number
  oldestDocument: DocumentInsightData | null
  newestDocument: DocumentInsightData | null
  averageDocsPerCategory: number
  categoryBreakdown: Record<string, number>
}

export function useDocumentInsights(documents: DocumentInsightData[]): DocumentStats {
  return useMemo(() => {
    const stats: DocumentStats = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
      categoriesCount: new Set(documents.map((d) => d.category).filter(Boolean)).size,
      expiringCount: documents.filter((doc) => {
        if (!doc.expiry_date) return false
        const expiry = new Date(doc.expiry_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        expiry.setHours(0, 0, 0, 0)
        const daysUntilExpiry = Math.ceil(
          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilExpiry <= 30
      }).length,
      oldestDocument: documents.reduce((oldest, current) => {
        if (!oldest) return current
        const oldestDate = new Date(oldest.created_at || 0)
        const currentDate = new Date(current.created_at || 0)
        return currentDate < oldestDate ? current : oldest
      }, null as DocumentInsightData | null),
      newestDocument: documents.reduce((newest, current) => {
        if (!newest) return current
        const newestDate = new Date(newest.created_at || 0)
        const currentDate = new Date(current.created_at || 0)
        return currentDate > newestDate ? current : newest
      }, null as DocumentInsightData | null),
      averageDocsPerCategory: 0,
      categoryBreakdown: {},
    }

    // Calculate category breakdown
    documents.forEach((doc) => {
      if (doc.category) {
        stats.categoryBreakdown[doc.category] = (stats.categoryBreakdown[doc.category] || 0) + 1
      }
    })

    // Calculate average docs per category
    if (stats.categoriesCount > 0) {
      stats.averageDocsPerCategory = Math.round(stats.totalDocuments / stats.categoriesCount)
    }

    return stats
  }, [documents])
}

export function DocumentInsightsPanel({ documents, className }: DocumentInsightConfig) {
  const stats = useDocumentInsights(documents)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* Total Documents */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:border-blue-300/50 dark:hover:border-blue-700/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Total Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalDocuments}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.averageDocsPerCategory} por categoría
          </p>
        </CardContent>
      </Card>

      {/* Storage Used */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:border-orange-300/50 dark:hover:border-orange-700/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Folder className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Espacio Usado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{formatBytes(stats.totalSize)}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.categoriesCount} categorías
          </p>
        </CardContent>
      </Card>

      {/* Expiring Soon */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:border-red-300/50 dark:hover:border-red-700/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Próximos a Vencer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('text-3xl font-bold', stats.expiringCount > 0 && 'text-red-600 dark:text-red-400')}>
            {stats.expiringCount}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            en los próximos 30 días
          </p>
        </CardContent>
      </Card>

      {/* Most Active Category */}
      <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            Categoría Top
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.categoryBreakdown).length > 0 ? (
            <>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a)[0][1]}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a)[0][0]}
              </p>
            </>
          ) : (
            <div className="text-sm text-gray-400">Sin categorías</div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Info */}
      {stats.newestDocument && (
        <Card className="lg:col-span-2 border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-400">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              Documento Más Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-semibold truncate text-green-700 dark:text-green-400">{stats.newestDocument.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              📅 {formatDate(stats.newestDocument.created_at)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Oldest Document Info */}
      {stats.oldestDocument && (
        <Card className="lg:col-span-2 border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-500">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded bg-slate-200 dark:bg-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              Documento Más Antiguo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-semibold truncate text-slate-700 dark:text-slate-300">{stats.oldestDocument.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              📅 {formatDate(stats.oldestDocument.created_at)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
