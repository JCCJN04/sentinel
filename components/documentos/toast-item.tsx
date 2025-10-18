'use client'

import { useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Info, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastConfig {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  onUndo?: () => Promise<void> | void
  undoLabel?: string
  dismissible?: boolean
}

interface ToastItemProps extends ToastConfig {
  onDismiss: (id: string) => void
}

export function ToastItem({
  id,
  title,
  description,
  type,
  duration,
  onUndo,
  undoLabel,
  dismissible,
  onDismiss,
}: ToastItemProps) {
  const [isUndoing, setIsUndoing] = useState(false)
  const [hasUndone, setHasUndone] = useState(false)

  const handleUndo = useCallback(async () => {
    if (!onUndo) return
    setIsUndoing(true)
    try {
      await onUndo()
      setHasUndone(true)
    } finally {
      setIsUndoing(false)
    }
  }, [onUndo])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertCircle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg p-4 shadow-lg border animate-in slide-in-from-right-full duration-300 max-w-md',
        type === 'success' && 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
        type === 'error' && 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
        type === 'warning' && 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800',
        type === 'info' && 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
        hasUndone && 'opacity-75'
      )}
    >
      <div className="flex-shrink-0 pt-0.5">{getIcon()}</div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && (
          <p className="text-xs mt-1 opacity-90">{description}</p>
        )}
        {onUndo && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={isUndoing || hasUndone}
              className={cn(
                'h-7 px-2 text-xs',
                type === 'success' && 'hover:bg-green-100 dark:hover:bg-green-900',
                type === 'error' && 'hover:bg-red-100 dark:hover:bg-red-900',
                type === 'warning' && 'hover:bg-amber-100 dark:hover:bg-amber-900',
                type === 'info' && 'hover:bg-blue-100 dark:hover:bg-blue-900'
              )}
            >
              {isUndoing ? 'Undoing...' : hasUndone ? 'Undone' : undoLabel || 'Undo'}
            </Button>
          </div>
        )}
      </div>

      {dismissible !== false && (
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
