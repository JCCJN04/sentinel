"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Verificar autenticación cuando cambie el estado de carga o el usuario
    if (!isLoading) {
      if (user) {
        setAuthorized(true)
      } else {
        // Redirigir al login si no hay usuario
        window.location.href = "/login"
      }
    }
  }, [user, isLoading])

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // No mostrar nada hasta que se autorice
  if (!authorized) {
    return null
  }

  // Mostrar el contenido protegido
  return <>{children}</>
}
