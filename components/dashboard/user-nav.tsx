"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// No longer need to import supabase directly here
// import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation" // Keep if needed for non-auth navigation
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth" // Import the auth hook
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function UserNav() {
  // Get user and the signOut function from the auth context
  const { user, signOut } = useAuth();
  const router = useRouter(); // Keep router if used elsewhere, though signOut in hook might handle it
  const [isSigningOut, setIsSigningOut] = useState(false); // Renamed for clarity

  // Handle sign-out using the function from the useAuth hook
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Call the signOut function provided by the useAuth hook
      await signOut();
      // The signOut function in useAuth should handle redirection,
      // but you can keep this as a fallback if needed, though it might be redundant.
      // router.push("/login");
      console.log("Sign out initiated via useAuth hook.");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Optionally display an error message to the user
    } finally {
      // Setting loading to false might be handled by the hook's state management,
      // but it's safe to keep it here too.
      setIsSigningOut(false);
    }
  };

  // Helper function to get user initials for the avatar fallback
  const getUserInitials = () => {
    // Use first_name and last_name if available from profile, otherwise fallback to email
    // This assumes your `user` object might eventually contain profile data
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
        return (user.user_metadata.first_name[0] + user.user_metadata.last_name[0]).toUpperCase();
    }
    // Fallback to email if name is not available
    if (!user?.email) return "??"; // Default if no email either
    const emailPrefix = user.email.split("@")[0];
    return emailPrefix.substring(0, 2).toUpperCase();
  };

  // Get avatar URL from user metadata if available
  const avatarUrl = user?.user_metadata?.avatar_url || "/placeholder.svg"; // Use placeholder if no avatar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* Use the actual avatar URL or placeholder */}
            <AvatarImage src={avatarUrl} alt={user?.email || "User Avatar"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {/* Display name if available, otherwise default */}
              {user?.user_metadata?.first_name || "Mi Cuenta"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Use Link component for internal navigation */}
          <Link href="/dashboard/perfil" passHref>
            <DropdownMenuItem>
              Perfil
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/configuracion" passHref>
            <DropdownMenuItem>
              Configuración
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          {/* Add other menu items as needed */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cerrando sesión...
            </>
          ) : (
            <>
              Cerrar sesión
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
