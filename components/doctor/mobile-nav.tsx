"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, HeartPulse, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { doctorSidebarItems } from "@/config/doctor-nav"

export function DoctorMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="shrink-0 md:hidden rounded-2xl border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all hover-scale"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 w-80 bg-gradient-to-b from-background to-muted/20">
        {/* Header premium */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-accent/5 p-6">
          <Link
            href="/doctor"
            className="flex items-center gap-3 transition-transform hover:scale-105"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                HealthPal
              </span>
              <span className="text-xs text-muted-foreground font-medium">Módulo Doctores</span>
            </div>
          </Link>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-2 px-3">
            {doctorSidebarItems.map((item, index) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/doctor" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base font-medium transition-all duration-200",
                    "hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    isActive
                      ? "bg-white/20"
                      : "bg-muted/50 group-hover:bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                    )} />
                  </div>
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        
        {/* Footer */}
        <div className="border-t p-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              🚀 Diseñado para doctores
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Gestión eficiente y moderna
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
