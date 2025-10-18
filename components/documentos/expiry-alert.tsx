'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ExpiryAlertConfig {
  documentName: string
  expiryDate: string
  daysUntilExpiry: number
  documentId: string
  onRenew?: () => void
  onDismiss?: () => void
}

interface ExpiryAlertProps extends ExpiryAlertConfig {
  show: boolean
}

export function ExpiryAlert({
  documentName,
  expiryDate,
  daysUntilExpiry,
  documentId,
  onRenew,
  onDismiss,
  show,
}: ExpiryAlertProps) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  const isUrgent = daysUntilExpiry <= 7
  const isExpired = daysUntilExpiry < 0

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const getBackgroundColor = () => {
    if (isExpired) return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    if (isUrgent) return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
    return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
  }

  const getTextColor = () => {
    if (isExpired) return 'text-red-900 dark:text-red-100'
    if (isUrgent) return 'text-orange-900 dark:text-orange-100'
    return 'text-yellow-900 dark:text-yellow-100'
  }

  const getIconColor = () => {
    if (isExpired) return 'text-red-600 dark:text-red-400'
    if (isUrgent) return 'text-orange-600 dark:text-orange-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  const getMessage = () => {
    if (isExpired) {
      return `Este documento expiró hace ${Math.abs(daysUntilExpiry)} días`
    }
    if (isUrgent) {
      return `Este documento expirará en ${daysUntilExpiry} días`
    }
    return `Este documento expirará pronto (${daysUntilExpiry} días)`
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border animate-in slide-in-from-top-2 duration-300',
        getBackgroundColor(),
        getTextColor()
      )}
    >
      <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', getIconColor())} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{documentName}</p>
        <p className="text-xs opacity-90 flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3" />
          Expira: {new Date(expiryDate).toLocaleDateString('es-MX')}
        </p>
        <p className="text-xs opacity-75 mt-1">{getMessage()}</p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {onRenew && !isExpired && (
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onRenew}
            variant="default"
          >
            Renovar
          </Button>
        )}
        {onRenew && isExpired && (
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onRenew}
            variant="default"
          >
            Actualizar
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
