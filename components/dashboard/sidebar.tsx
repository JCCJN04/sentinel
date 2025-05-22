"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils" // Ya estás importando cn, ¡genial!
import { AlertCircle, Shield, BarChart3, FileText, Home, Settings, Share2, Upload, Users, type LucideIcon } from "lucide-react"
// import { Logo } from "@/components/icons" // Logo no se usa en este archivo, se podría quitar si no se va a usar.

// Definimos una interfaz para los items de la barra lateral para mejor tipado
interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon; // Usamos el tipo LucideIcon para el icono
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Documentos",
    href: "/dashboard/documentos",
    icon: FileText,
  },
  {
    title: "Subir documento",
    href: "/dashboard/subir",
    icon: Upload,
  },
  /*
  {
    title: "Alertas",
    href: "/dashboard/alertas",
    icon: AlertCircle,
  },
  {
    title: "Compartidos",
    href: "/dashboard/compartidos",
    icon: Share2,
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
  },
  {
    title: "Familia",
    href: "/dashboard/familia",
    icon: Users,
  },*/
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
]

// 1. Define una interfaz para las props del Sidebar
interface SidebarProps {
  className?: string; // className es opcional y de tipo string
}

// 2. Actualiza la firma de la función para aceptar props y desestructura className
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    // 3. Usa `cn` para fusionar las clases existentes con la prop className
    <div className={cn("hidden border-r bg-muted/40 md:block md:w-64", className)}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex items-center gap-2 p-4">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Sentinel</span>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isActive ? "bg-muted text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}