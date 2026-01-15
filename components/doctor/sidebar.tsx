"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { doctorSidebarItems } from "@/config/doctor-nav"
import { HeartPulse, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DoctorSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn("hidden border-r bg-background md:block", className)}>
      <div className="flex h-full max-h-screen flex-col">
        {/* Branding más compacto */}
        <div className="flex h-14 sm:h-16 items-center px-4 sm:px-6 border-b">
          <Link href="/doctor" className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
              <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              HealthPal
            </span>
          </Link>
        </div>
        
        {/* CTA Principal Destacado */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <Button 
            asChild 
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-accent text-white rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all text-sm sm:text-base"
          >
            <Link href="/doctor/consultas/nueva" className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold">Nueva Consulta</span>
            </Link>
          </Button>
        </div>

        {/* Navigation - Más espaciada y clara */}
        <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4 space-y-1">
          {doctorSidebarItems.map((item, index) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/doctor" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 shrink-0",
                  isActive && "text-primary"
                )} />
                <span className="truncate">{item.title}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer minimalista */}
        <div className="border-t p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs text-center text-muted-foreground">
            <p className="font-medium">Diseñado para doctores</p>
          </div>
        </div>
      </div>
    </div>
  )
}
