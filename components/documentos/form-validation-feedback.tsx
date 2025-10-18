'use client'

import { Check, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormValidationFeedbackProps {
  isValid?: boolean
  isValidating?: boolean
  error?: string | null
  success?: string | null
  info?: string | null
  className?: string
}

export function FormValidationFeedback({
  isValid,
  isValidating,
  error,
  success,
  info,
  className,
}: FormValidationFeedbackProps) {
  if (!error && !success && !info && !isValidating) {
    return null
  }

  return (
    <div
      className={cn(
        'text-sm px-3 py-2 rounded-md flex items-start gap-2 animate-in fade-in slide-in-from-top-1',
        error && 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800',
        success && 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800',
        info && 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
        isValidating && 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
        className
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        {error && <AlertCircle className="h-4 w-4" />}
        {success && <Check className="h-4 w-4" />}
        {(info || isValidating) && <Info className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        {error && <p>{error}</p>}
        {success && <p>{success}</p>}
        {info && <p>{info}</p>}
        {isValidating && <p>Validando...</p>}
      </div>
    </div>
  )
}

interface FieldValidationStateProps {
  hasValue: boolean
  isValid?: boolean
  isDirty?: boolean
  error?: string | null
}

export function FieldValidationState({
  hasValue,
  isValid,
  isDirty,
  error,
}: FieldValidationStateProps) {
  if (!isDirty && !hasValue) {
    return null
  }

  if (error) {
    return (
      <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </span>
    )
  }

  if (isDirty && isValid && hasValue) {
    return (
      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
        <Check className="h-3 w-3" />
        Validado
      </span>
    )
  }

  return null
}
