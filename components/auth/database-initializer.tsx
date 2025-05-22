"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabaseBrowserClient as supabase } from "@/lib/supabase";

export function DatabaseInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    const initializeUserProfile = async () => {
      if (!user) return

      try {
        // Verificar si el perfil ya existe
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (checkError) {
          console.error("Error checking profile:", checkError)
          return
        }

        // Si no existe, crear el perfil
        if (!existingProfile) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            first_name: "",
            last_name: "",
            avatar_url: "",
            language: "es",
            timezone: "America/Mexico_City",
            date_format: "DD/MM/YYYY",
          })

          if (insertError) {
            console.error("Error creating profile:", insertError)
          }
        }
      } catch (error) {
        console.error("Error initializing database:", error)
      }
    }

    initializeUserProfile()
  }, [user])

  return null
}
