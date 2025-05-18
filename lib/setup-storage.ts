import { supabase } from "./supabase"

export async function setupStorage() {
  try {
    // Verificar si el bucket 'documents' existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return
    }

    const documentsBucketExists = buckets.some((bucket) => bucket.name === "documents")

    // Si no existe, crearlo
    if (!documentsBucketExists) {
      const { error: createError } = await supabase.storage.createBucket("documents", {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        console.error("Error creating documents bucket:", createError)
        return
      }

      console.log("Documents bucket created successfully")
    }

    // Configurar políticas de acceso para el bucket
    const { error: policyError } = await supabase.storage.from("documents").createSignedUrl("test.txt", 60)

    if (policyError) {
      console.error("Error setting up storage policies:", policyError)
      return
    }

    // Configurar políticas de RLS para el bucket
    const { error: rlsError } = await supabase.rpc("create_storage_policy", {
      bucket_name: "documents",
      policy_name: "User Access",
      definition: "auth.uid() = owner",
      operation: "SELECT",
    })

    if (rlsError) {
      console.error("Error setting up RLS policies:", rlsError)
      return
    }

    console.log("Storage setup completed successfully")
  } catch (error) {
    console.error("Error setting up storage:", error)
  }
}
