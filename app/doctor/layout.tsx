import type { ReactNode } from "react"
import { DoctorSidebar } from "@/components/doctor/sidebar"
import { DoctorHeader } from "@/components/doctor/header"

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
      <DoctorSidebar />
      <div className="flex flex-col bg-muted/40">
        <DoctorHeader />
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
