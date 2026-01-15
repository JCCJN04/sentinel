import type { ReactNode } from "react"
import { DoctorSidebar } from "@/components/doctor/sidebar"
import { DoctorHeader } from "@/components/doctor/header"

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <DoctorSidebar />
      <div className="flex flex-col">
        <DoctorHeader />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
