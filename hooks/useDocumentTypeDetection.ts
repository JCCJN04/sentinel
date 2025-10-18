'use client'

import { useMemo } from 'react'

export type DocumentType = 'medical_report' | 'lab_test' | 'receipt' | 'prescription' | 'insurance' | 'vaccination' | 'unknown'

export interface DocumentTypeDetection {
  type: DocumentType
  suggestedCategory: string
  relevantFields: string[]
  confidence: number
}

// Keywords para detección automática
const DOCUMENT_PATTERNS = {
  medical_report: {
    keywords: ['reporte', 'informe', 'diagnóstico', 'diagnosis', 'clinical', 'médico', 'médica', 'doctor', 'paciente', 'examen'],
    category: 'Reportes Médicos',
    fields: ['doctor_name', 'specialty', 'patient_name', 'date']
  },
  lab_test: {
    keywords: ['laboratorio', 'análisis', 'sangre', 'hemograma', 'examen de', 'test', 'lab', 'laboratory'],
    category: 'Laboratorios',
    fields: ['doctor_name', 'date', 'patient_name']
  },
  receipt: {
    keywords: ['recibo', 'factura', 'invoice', 'receipt', 'comprobante', 'pago', 'boleta', 'ticket'],
    category: 'Recibos y Facturas',
    fields: ['provider', 'amount', 'currency', 'date']
  },
  prescription: {
    keywords: ['prescripción', 'medicamento', 'medicamentos', 'receta', 'prescription', 'pharmacy', 'farmacia'],
    category: 'Prescripciones',
    fields: ['doctor_name', 'date', 'specialty']
  },
  insurance: {
    keywords: ['seguro', 'insurance', 'póliza', 'cobertura', 'claim'],
    category: 'Seguros',
    fields: ['provider', 'date']
  },
  vaccination: {
    keywords: ['vacuna', 'vacunación', 'vaccine', 'vaccination', 'carnet de vacunas'],
    category: 'Vacunas',
    fields: ['date', 'specialty', 'provider']
  }
}

export function useDocumentTypeDetection(fileName?: string): DocumentTypeDetection {
  return useMemo(() => {
    if (!fileName) {
      return {
        type: 'unknown',
        suggestedCategory: 'General',
        relevantFields: [],
        confidence: 0
      }
    }

    const nameLower = fileName.toLowerCase()
    let bestMatch: { type: DocumentType; score: number } = {
      type: 'unknown',
      score: 0
    }

    // Buscar patrón que más coincida
    Object.entries(DOCUMENT_PATTERNS).forEach(([docType, pattern]) => {
      const matchedKeywords = pattern.keywords.filter(keyword =>
        nameLower.includes(keyword.toLowerCase())
      ).length

      if (matchedKeywords > bestMatch.score) {
        bestMatch = {
          type: docType as Exclude<DocumentType, 'unknown'>,
          score: matchedKeywords
        }
      }
    })

    if (bestMatch.score === 0) {
      return {
        type: 'unknown',
        suggestedCategory: 'General',
        relevantFields: [],
        confidence: 0
      }
    }

    const pattern = DOCUMENT_PATTERNS[bestMatch.type as Exclude<DocumentType, 'unknown'>]
    const confidence = Math.min(bestMatch.score / pattern.keywords.length, 1)

    return {
      type: bestMatch.type as Exclude<DocumentType, 'unknown'>,
      suggestedCategory: pattern.category,
      relevantFields: pattern.fields,
      confidence
    }
  }, [fileName])
}
