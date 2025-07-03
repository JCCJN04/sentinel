"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// --- 1. SE AÑADIERON TODOS LOS ICONOS QUE FALTABAN ---
import { 
  HeartPulse, 
  Shield, 
  FileText, 
  Home, 
  Settings, 
  ShieldAlert, 
  Upload, 
  AlertCircle, 
  Share2, 
  BarChart3, 
  Users,
  type LucideIcon 
} from "lucide-react" 

// Interfaz para los items de la barra lateral
interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

// Array con los elementos de la barra lateral (descomentados)
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
    title: "Recetas",
    href: "/dashboard/prescriptions",
    icon: HeartPulse,
  },
  {
    title: "Alergias",
    href: "/dashboard/alergias",
    icon: ShieldAlert,
  },
  {
    title: "Subir documento",
    href: "/dashboard/subir",
    icon: Upload,
  },
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
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
]

// Interfaz para las props del Sidebar
interface SidebarProps {
  className?: string;
}

// Componente Sidebar actualizado
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
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
              const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");

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