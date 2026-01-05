"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { doctorSidebarItems } from "@/config/doctor-nav"

export function DoctorMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <div className="border-b p-4">
          <Link
            href="/doctor"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <img
              src="/healthpal.png"
              alt="HealthPal"
              width={180}
              height={44}
              className="object-contain"
            />
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-2 p-4 text-lg font-medium">
            {doctorSidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
