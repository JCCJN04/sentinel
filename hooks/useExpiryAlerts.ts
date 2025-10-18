'use client'

import { useCallback } from 'react'
import type { ExpiryAlertConfig } from '@/components/documentos/expiry-alert'

export interface DocumentWithExpiry {
  id: string
  name: string
  expiry_date: string | null
  category?: string
}

export function useExpiryAlerts() {
  const calculateDaysUntilExpiry = useCallback((expiryDate: string | null) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }, [])

  const getExpiringDocuments = useCallback(
    (documents: DocumentWithExpiry[], threshold: number = 30) => {
      return documents
        .filter((doc) => {
          const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiry_date)
          return daysUntilExpiry !== null && daysUntilExpiry <= threshold
        })
        .map((doc) => ({
          documentName: doc.name,
          expiryDate: doc.expiry_date!,
          daysUntilExpiry: calculateDaysUntilExpiry(doc.expiry_date)!,
          documentId: doc.id,
          category: doc.category,
        }))
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    },
    [calculateDaysUntilExpiry]
  )

  const getUrgentExpirations = useCallback(
    (documents: DocumentWithExpiry[]) => {
      return getExpiringDocuments(documents, 7)
    },
    [getExpiringDocuments]
  )

  const formatExpiryDate = useCallback((date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  return {
    calculateDaysUntilExpiry,
    getExpiringDocuments,
    getUrgentExpirations,
    formatExpiryDate,
  }
}
