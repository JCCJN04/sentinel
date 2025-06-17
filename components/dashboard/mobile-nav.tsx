"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, FileText, Bell, Settings, Menu, LogOut, Upload, Users, BarChart3, Share2 } from "lucide-react" // Added more icons
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
// Remove direct supabase import
// import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth" // Import the auth hook
import { Loader2 } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter(); // Keep for potential future use, but signOut handles redirect
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth(); // Get signOut from the hook
  const [isSigningOut, setIsSigningOut] = useState(false); // Renamed state

  // Handle sign-out using the function from the useAuth hook
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(); // Use the signOut from the hook
      // The hook's signOut should handle redirection
      // router.push("/login");
      console.log("MobileNav: Sign out initiated via useAuth hook.");
    } catch (error) {
      console.error("Error during mobile sign out:", error);
    } finally {
      setIsSigningOut(false);
      setOpen(false); // Close the sheet after attempting sign out
    }
  };

  // Define navigation items, potentially adjusting for medical focus later
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    // Consider renaming "Documentos" to "Expedientes" or "Historial Médico"
    { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
    { name: "Subir", href: "/dashboard/subir", icon: Upload }, // Added Upload link
    //{ name: "Alertas", href: "/dashboard/alertas", icon: Bell },
    //{ name: "Compartidos", href: "/dashboard/compartidos", icon: Share2 }, // Added Shared link
    //{ name: "Reportes", href: "/dashboard/reportes", icon: BarChart3 }, // Added Reports link
    //{ name: "Familia", href: "/dashboard/familia", icon: Users }, // Added Family link
    { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
  ];

  // Determine which items show in the bottom bar (max 4 + Menu)
  const bottomNavItems = navItems.slice(0, 4); // Show first 4 items in bottom bar

  return (
    <div className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t bg-background px-2 md:hidden">
      {/* Bottom Bar Items */}
      {bottomNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)} // Close sheet if open
          className={cn(
            "flex flex-col items-center justify-center p-1 text-center text-xs w-1/5", // Ensure items distribute space
            pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard') // Highlight active section
              ? "text-primary"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          <item.icon className="mb-1 h-5 w-5 flex-shrink-0" />
          <span className="truncate w-full">{item.name}</span>
        </Link>
      ))}

      {/* Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="flex flex-col items-center justify-center p-1 text-center text-xs text-muted-foreground hover:text-primary w-1/5"
          >
            <Menu className="mb-1 h-5 w-5 flex-shrink-0" />
            <span className="truncate w-full">Menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-xl flex flex-col"> {/* Increased height, flex column */}
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Menú Principal</SheetTitle>
          </SheetHeader>
          {/* Scrollable Navigation List */}
          <nav className="mt-4 flex-grow overflow-y-auto pb-4">
            <div className="flex flex-col space-y-2 pr-2"> {/* Added padding-right */}
              {/* Display all nav items in the sheet */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)} // Close sheet on link click
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard')
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              ))}
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    {"opacity-50 cursor-not-allowed": isSigningOut}
                )}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Cerrando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar sesión</span>
                  </>
                )}
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
