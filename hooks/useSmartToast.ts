'use client'

import { useState, useCallback, useRef } from 'react'
import type { ToastConfig, ToastType } from '@/components/documentos/toast-item'

interface ToastWithTimeout extends ToastConfig {
  timeoutId?: NodeJS.Timeout
}

export function useSmartToast() {
  const [toasts, setToasts] = useState<ToastWithTimeout[]>([])
  const idCounterRef = useRef(0)

  const addToast = useCallback(
    (config: Omit<ToastConfig, 'id'>) => {
      const id = `toast-${idCounterRef.current++}`
      const duration = config.duration ?? (config.type === 'error' ? 5000 : 3000)

      const toast: ToastWithTimeout = {
        ...config,
        id,
      }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id)
        }, duration)

        toast.timeoutId = timeoutId
      }

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id)
      if (toast?.timeoutId) {
        clearTimeout(toast.timeoutId)
      }
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  const success = useCallback(
    (title: string, config?: Partial<Omit<ToastConfig, 'id' | 'type'>>) => {
      return addToast({
        type: 'success',
        title,
        ...config,
      })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, config?: Partial<Omit<ToastConfig, 'id' | 'type'>>) => {
      return addToast({
        type: 'error',
        title,
        duration: 5000,
        ...config,
      })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, config?: Partial<Omit<ToastConfig, 'id' | 'type'>>) => {
      return addToast({
        type: 'info',
        title,
        ...config,
      })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, config?: Partial<Omit<ToastConfig, 'id' | 'type'>>) => {
      return addToast({
        type: 'warning',
        title,
        duration: 4000,
        ...config,
      })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
