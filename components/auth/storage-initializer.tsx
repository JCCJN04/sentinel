"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabaseBrowserClient as supabase } from "@/lib/supabase"; // Asumimos que esto es correcto ahora

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
          // Considerar si se debe detener la inicialización aquí o no.
          // Por ahora, se intentará crear el bucket de todas formas si hay error listando.
        }

        let documentsBucketExists = false;
        if (buckets) { // Solo proceder si la lista de buckets se obtuvo
            documentsBucketExists = buckets.some((bucket) => bucket.name === "documents")
        }


        // Si no existe, crearlo
        if (!documentsBucketExists) {
          try {
            console.log("Attempting to create 'documents' bucket...");
            const { error: createError } = await supabase.storage.createBucket("documents", {
              public: true, // Bucket público. Para control granular, usar public: false y RLS.
              // file_size_limit: 1024 * 1024 * 10, // Ejemplo: Límite de 10MB por archivo
              // allowed_mime_types: ['image/png', 'application/pdf'], // Ejemplo: Tipos MIME permitidos
            })

            if (createError) {
              // Manejar errores comunes como "Bucket already exists" si la lógica de 'documentsBucketExists' falló
              if (createError.message.includes("already exists")) {
                console.warn("Documents bucket creation reported error, but it might already exist:", createError.message);
              } else {
                console.error("Error creating documents bucket:", createError);
              }
            } else {
              console.log("Documents bucket created successfully or already existed.")
            }
          } catch (bucketError) {
            console.error("Exception creating bucket:", bucketError)
          }
        } else {
          console.log("Documents bucket already exists")
        }

        // La sección de setAccessControl ha sido eliminada porque no es un método válido
        // en StorageFileApi y las políticas de acceso granular se manejan mejor con RLS
        // directamente en Supabase (SQL) o al definir el bucket como no público.
        // Si el bucket se creó con public: true, ya es accesible públicamente.
        // Para políticas específicas (ej. solo el propietario puede leer/escribir),
        // configura RLS en la tabla storage.objects en tu panel de Supabase.

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing storage:", error)
      }
    }

    if (user && !initialized) { // Asegurarse de que el usuario exista y no se haya inicializado
        initializeStorage()
    }
  }, [initialized, user])

  return null
}