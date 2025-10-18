'use client'

import { ToastItem, type ToastConfig } from '@/components/documentos/toast-item'

interface ToastContainerProps {
  toasts: ToastConfig[]
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'bottom-right',
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 pointer-events-none`}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
