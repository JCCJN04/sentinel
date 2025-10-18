import { MobileNav } from "./mobile-nav" // Importamos el menú móvil
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/dashboard/user-nav"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {/* El menú móvil (botón hamburguesa) se mostrará aquí en pantallas pequeñas */}
      <MobileNav />
      
      {/* Espaciador flexible */}
      <div className="ml-auto flex items-center gap-4">
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  )
}