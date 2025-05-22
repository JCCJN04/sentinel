// Import the browser client and alias it as supabase
import { supabaseBrowserClient as supabase } from "./supabase"

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
        public: false, // Typically, you'd want this to be true if using RLS for public access with user-specific restrictions
        fileSizeLimit: 10485760, // 10MB
        // Consider adding allowedMimeTypes here if applicable
        // allowedMimeTypes: ['image/png', 'application/pdf'],
      })

      if (createError) {
        console.error("Error creating documents bucket:", createError)
        // It might be that the bucket exists but the initial check failed,
        // or there's a permission issue.
        if (createError.message.includes("already exists")) {
            console.log("Documents bucket already exists (detected during creation attempt).")
        } else {
            return;
        }
      } else {
        console.log("Documents bucket created successfully")
      }
    } else {
        console.log("Documents bucket already exists.")
    }

    // The following policy setup might be better handled directly in Supabase Studio SQL editor
    // or as part of your database migrations, as client-side RPC calls for policy creation
    // can be complex to manage and secure.

    // Example of creating a signed URL (useful for testing, but not directly policy setup)
    // This line seems more for testing if the bucket is accessible rather than setting policies.
    // It will attempt to create a signed URL for a non-existent file "test.txt".
    // If the bucket exists and is accessible, this might succeed or fail based on policies
    // but it doesn't *set* policies.
    // For actual RLS, you need to define policies in SQL.
    // Let's assume this was for a quick check and comment it out or clarify its purpose.
    /*
    const { data: signedUrlData, error: policyError } = await supabase.storage.from("documents").createSignedUrl("test.txt", 60)

    if (policyError) {
      // This error might indicate that RLS is preventing even this action if policies are strict.
      console.warn("Warning creating signed URL for 'test.txt' (might be expected if policies are restrictive or file doesn't exist):", policyError)
    } else if (signedUrlData) {
      console.log("Successfully created a test signed URL:", signedUrlData.signedUrl)
    }
    */

    // Attempting to set up RLS policies via RPC.
    // Ensure the 'create_storage_policy' RPC function exists and is callable by the authenticated user.
    // This is a custom RPC function you would have to define in your Supabase SQL editor.
    // Example RPC function (simplified):
    // CREATE OR REPLACE FUNCTION create_storage_policy(bucket_name TEXT, policy_name TEXT, definition TEXT, operation TEXT)
    // RETURNS void AS $$
    // BEGIN
    //   EXECUTE format('ALTER POLICY %I ON storage.objects FOR %s USING (%s)', policy_name, operation, definition);
    // END;
    // $$ LANGUAGE plpgsql;
    //
    // Note: Directly managing RLS policies like this via client-side calls is generally not recommended
    // for security and manageability. These are typically set up via SQL migrations.

    /*
    // Consider if this RPC call is still needed or correctly implemented.
    // It's commented out as it depends on a custom RPC function.
    const { error: rlsError } = await supabase.rpc("create_storage_policy", {
      bucket_name: "documents",
      policy_name: "User Access Select", // Policy names should be unique
      definition: "bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]", // Example: user can access their own folder
      operation: "SELECT",
    })

    if (rlsError) {
      console.error("Error setting up RLS SELECT policy via RPC:", rlsError)
      // return // Decide if this is a fatal error for the setup
    } else {
      console.log("Attempted to set RLS SELECT policy via RPC.")
    }

    const { error: rlsInsertError } = await supabase.rpc("create_storage_policy", {
      bucket_name: "documents",
      policy_name: "User Access Insert",
      definition: "bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]",
      operation: "INSERT",
    })

    if (rlsInsertError) {
        console.error("Error setting up RLS INSERT policy via RPC:", rlsInsertError);
    } else {
        console.log("Attempted to set RLS INSERT policy via RPC.");
    }
    */

    console.log("Storage setup check completed.")
  } catch (error) {
    console.error("Error in setupStorage function:", error)
  }
}
