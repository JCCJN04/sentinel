"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

export function StorageInitializer() {
  const { user } = useAuth()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeStorage = async () => {
      if (initialized || !user) return

      try {
        // Verificar si el bucket 'documents' existe
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

        if (bucketsError) {
          console.error("Error listing buckets:", bucketsError)
          // Continuamos con el resto del código
        } else {
          const documentsBucketExists = buckets.some((bucket) => bucket.name === "documents")

          // Si no existe, crearlo
          if (!documentsBucketExists) {
            try {
              const { error: createError } = await supabase.storage.createBucket("documents", {
                public: true, // Para simplificar, en producción debería ser false con políticas adecuadas
              })

              if (createError) {
                console.error("Error creating documents bucket:", createError)
              } else {
                console.log("Documents bucket created successfully")
              }
            } catch (bucketError) {
              console.error("Exception creating bucket:", bucketError)
            }
          } else {
            console.log("Documents bucket already exists")
          }
        }

        // En lugar de usar la función RPC, aplicamos las políticas directamente
        try {
          // Aplicar políticas de almacenamiento básicas
          const { error: policyError } = await supabase.storage.from("documents").setAccessControl({
            bucket: "documents",
            owner: user.id,
            public: false,
          })

          if (policyError) {
            console.error("Error setting storage access control:", policyError)
          }
        } catch (policyError) {
          console.error("Exception setting storage policies:", policyError)
        }

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing storage:", error)
      }
    }

    initializeStorage()
  }, [initialized, user])

  return null
}
