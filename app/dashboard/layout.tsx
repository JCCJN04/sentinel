import type { ReactNode } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MobileNav } from "@/components/dashboard/mobile-nav"
// 1. Importa el componente del asistente de chat
import AIChatAssistant from '@/components/dashboard/ai-chat-assistant'; // Asegúrate que la ruta sea correcta

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col"> {/* Añadido flex flex-col aquí */}
        <DashboardHeader />
        {/* El main ahora ocupa el espacio restante y permite scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>
        {/* MobileNav se superpone en la parte inferior en móviles */}
        <MobileNav />
        {/* 2. Añade el componente del asistente de chat aquí */}
        {/* Su posicionamiento 'fixed' lo sacará del flujo normal */}
        <AIChatAssistant />
      </div>
    </div>
  )
}
