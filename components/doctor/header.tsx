import { DoctorMobileNav } from "./mobile-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/dashboard/user-nav"

export function DoctorHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-6 lg:h-20 transition-all">
      <DoctorMobileNav />
      
      {/* Spacer para empujar elementos a la derecha */}
      <div className="flex-1" />
      
      {/* Actions con hover effects premium */}
      <div className="flex items-center gap-3">
        <div className="hover-scale">
          <ModeToggle />
        </div>
        <UserNav />
      </div>
    </header>
  )
}
