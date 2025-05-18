"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Corrected import: Import supabaseBrowserClient and rename it to supabase
import { supabaseBrowserClient as supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

// Interface for the authentication context value
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any | null }>
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Authentication provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter() // Using next/navigation for App Router compatibility (though Pages Router might use next/router)

  useEffect(() => {
    // Function to get the current session on initial load
    const getSession = async () => {
      setIsLoading(true)
      try {
        // Use the imported supabase client (originally supabaseBrowserClient)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error)
          return
        }

        // Set session and user state if a session exists
        if (data?.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
      } catch (error) {
        console.error("Unexpected error fetching session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Subscribe to authentication state changes (login, logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session) // Log event and session
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false) // Stop loading once auth state is confirmed
    })

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  // Function to handle user sign-in
  const signIn = async (email: string, password: string) => {
    setIsLoading(true); // Indicate loading state
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign-in error:", error)
        return { error }
      }

      // No need to manually set session/user here, onAuthStateChange handles it
      // setSession(data.session)
      // setUser(data.session?.user ?? null)

      return { error: null }
    } catch (error) {
      console.error("Unexpected sign-in error:", error)
      return { error } // Return the caught error
    } finally {
        setIsLoading(false); // Stop loading
    }
  }

  // Function to handle user sign-up
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Ensure this URL points to a page that handles the callback
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign-up error:", error)
        return { error, data: null }
      }

      // Usually, Supabase sends a confirmation email. User isn't logged in yet.
      // onAuthStateChange will trigger upon successful email confirmation/login.
      console.log("Sign-up successful, check email for confirmation:", data)
      return { error: null, data }
    } catch (error) {
      console.error("Unexpected sign-up error:", error)
      return { error, data: null }
    } finally {
        setIsLoading(false);
    }
  }

  // Function to handle user sign-out
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
          console.error("Sign-out error:", error);
          // Optionally handle the error (e.g., show a message)
      }
      // No need to manually set user/session to null, onAuthStateChange handles it
      // setUser(null)
      // setSession(null)
      router.push("/login") // Redirect to login page after sign out
    } catch (error) {
      console.error("Unexpected sign-out error:", error)
    } finally {
        // setIsLoading(false); // onAuthStateChange will set loading to false
    }
  }

  // Function to handle password reset request
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Ensure this URL points to a page where the user can set a new password
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error("Password reset request error:", error)
        return { error }
      }

      console.log("Password reset email sent to:", email)
      return { error: null }
    } catch (error) {
      console.error("Unexpected password reset error:", error)
      return { error }
    } finally {
        setIsLoading(false);
    }
  }

  // Provide the auth state and functions to children components
  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to easily consume the authentication context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Ensure the hook is used within an AuthProvider
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
