"use client"

// Removed Link import as it's no longer used here for the logo
// import Link from "next/link"
// Removed Logo import as it's no longer used here
// import { Logo } from "@/components/icons"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/dashboard/user-nav"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function DashboardHeader() {
  return (
    // Sticky header with background and bottom border
    <header className="sticky top-0 z-40 border-b bg-background">
      {/* Container to manage padding and flex layout */}
      <div
        className="container flex h-16 items-center justify-between px-4 md:px-6"
        suppressHydrationWarning // This prop is added to prevent hydration mismatch errors from browser extensions.
      >
        {/* Left section: Search Bar */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Logo and text removed from here */}

          {/* Search input for medium and larger screens */}
          <div className="hidden md:flex md:w-80 lg:w-96">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar documentos..."
                className="w-full rounded-md bg-muted pl-8 focus-visible:ring-primary" // Added bg-muted for contrast
                aria-label="Buscar documentos"
              />
            </div>
          </div>
        </div>

        {/* Right section: Theme toggle and User navigation */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}