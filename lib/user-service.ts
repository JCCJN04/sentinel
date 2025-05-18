// Import the browser client and rename it for convenience
import { supabaseBrowserClient as supabase } from "./supabase";

// Interface definitions
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string; // Email usually comes from auth user, not profile table directly
  phone: string;
  avatar_url: string;
  language: string;
  timezone: string;
  date_format: string;
  notification_preferences: NotificationPreferences;
  last_active: string; // ISO string format
}

export interface NotificationPreferences {
  documentReminders: boolean;
  expiryAlerts: boolean;
  paymentReminders: boolean;
  securityAlerts: boolean;
  newsletterUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reminderFrequency: "daily" | "weekly" | "monthly";
}

// Default notification preferences for new users or if DB value is null
const defaultNotificationPreferences: NotificationPreferences = {
  documentReminders: true,
  expiryAlerts: true,
  paymentReminders: true,
  securityAlerts: true,
  newsletterUpdates: false,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  reminderFrequency: "weekly",
};

/**
 * Fetches the profile data for the currently authenticated user.
 * Combines data from the 'profiles' table and the auth user object.
 * Assumes called from a client-side context.
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  console.log("Fetching user profile...");
  try {
    // Use the imported supabase client (originally supabaseBrowserClient)
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      console.error("getUserProfile: User not authenticated.", authError);
      // Don't throw here, return null as the function signature suggests
      return null;
      // throw new Error("User not authenticated");
    }
    const authUser = authData.user;
    console.log(`Authenticated user found: ${authUser.id}`);

    // Fetch profile data from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from("profiles") // Ensure this table name is correct
      .select("*")
      .eq("id", authUser.id) // Match profile ID with auth user ID
      .single(); // Expect exactly one profile per user

    // Handle profile fetch errors (including not found)
    if (profileError) {
      // 'PGRST116' means profile not found, which might be okay (e.g., new user)
      if (profileError.code === 'PGRST116') {
          console.warn(`Profile not found for user ${authUser.id}. Returning default data.`);
          // Return a default profile structure using auth data
          return {
            id: authUser.id,
            first_name: "", // Or derive from email/metadata if available
            last_name: "",
            email: authUser.email || "",
            phone: "",
            avatar_url: "",
            language: "es", // Default language
            timezone: "America/Mexico_City", // Default timezone
            date_format: "DD/MM/YYYY", // Default format
            notification_preferences: defaultNotificationPreferences,
            last_active: authUser.last_sign_in_at || new Date().toISOString(),
          };
      } else {
        console.error("Error fetching profile data:", profileError);
        throw profileError; // Throw other database errors
      }
    }

    // Combine auth data and profile data
    console.log("Profile data fetched successfully.");
    return {
      id: profileData.id,
      first_name: profileData.first_name || "",
      last_name: profileData.last_name || "",
      email: authUser.email || "", // Get email from auth user
      phone: profileData.phone || "",
      avatar_url: profileData.avatar_url || "",
      language: profileData.language || "es",
      timezone: profileData.timezone || "America/Mexico_City",
      date_format: profileData.date_format || "DD/MM/YYYY",
      // Ensure notification_preferences is always an object, use defaults if null/missing
      notification_preferences: profileData.notification_preferences
                                  ? { ...defaultNotificationPreferences, ...profileData.notification_preferences }
                                  : defaultNotificationPreferences,
      last_active: profileData.last_active || authUser.last_sign_in_at || new Date().toISOString(),
    };

  } catch (error) {
    console.error("Error getting user profile:", error);
    return null; // Return null on any unexpected error
  }
};

/**
 * Updates the user's profile data in the 'profiles' table.
 * @param updates - An object containing the profile fields to update.
 */
export const updateUserProfile = async (
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'last_active'>> // Exclude fields not in 'profiles' or managed elsewhere
): Promise<{ success: boolean; error?: string }> => {
  console.log("Updating user profile with:", updates);
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
       console.error("updateUserProfile: User not authenticated.", authError);
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;

    // Remove fields that shouldn't be directly updated in the profiles table
    const { email, id, last_active, ...profileUpdates } = updates as any;

    if (Object.keys(profileUpdates).length === 0) {
        console.warn("updateUserProfile called with no valid fields to update.");
        return { success: true }; // Nothing to update
    }

    // Perform the update on the 'profiles' table
    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId); // Ensure update is for the correct user

    if (updateError) {
      console.error("Error updating profile in database:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Profile for user ${userId} updated successfully.`);
    return { success: true };

  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Uploads a new avatar image for the user and updates their profile.
 * @param file - The image File object to upload.
 */
export const updateUserAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
  console.log(`Updating avatar for user. File: ${file.name}, Size: ${file.size}`);
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
       console.error("updateUserAvatar: User not authenticated.", authError);
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;

    // Define file path in storage (e.g., avatars/user-id.png)
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt) {
        throw new Error("Invalid file type (no extension).");
    }
    const fileName = `avatar-${userId}.${fileExt}`; // Consistent naming
    const filePath = `avatars/${fileName}`; // Bucket path
    console.log(`Uploading avatar to storage path: ${filePath}`);

    // 1. Upload the new avatar file to Supabase Storage
    // Use upsert: true to overwrite any existing avatar for the user
    const { error: uploadError } = await supabase.storage
      .from("avatars") // Ensure 'avatars' bucket exists and has appropriate policies
      .upload(filePath, file, {
        cacheControl: "3600", // Cache for 1 hour
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      console.error("Error uploading avatar to storage:", uploadError);
      return { success: false, error: uploadError.message };
    }
    console.log("Avatar uploaded to storage successfully.");

    // 2. Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
        console.error("Could not get public URL for uploaded avatar.");
        // Decide how to handle: maybe delete the uploaded file?
        return { success: false, error: "Failed to get avatar URL after upload." };
    }
     console.log(`Avatar public URL: ${publicUrl}`);

    // 3. Update the avatar_url in the user's profile table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl }) // Update the profile record
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile with new avatar URL:", updateError);
      // Consider rolling back storage upload if DB update fails? (More complex)
      return { success: false, error: updateError.message };
    }

    console.log(`Profile updated with new avatar URL for user ${userId}.`);
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error("Error updating user avatar:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Saves the user's notification preferences to their profile.
 * @param preferences - The complete NotificationPreferences object.
 */
export const saveNotificationPreferences = async (
  preferences: NotificationPreferences,
): Promise<{ success: boolean; error?: string }> => {
   console.log("Saving notification preferences:", preferences);
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
       console.error("saveNotificationPreferences: User not authenticated.", authError);
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;

    // Update the notification_preferences field in the profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ notification_preferences: preferences }) // Update the specific field
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating notification preferences in database:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Notification preferences updated for user ${userId}.`);
    return { success: true };

  } catch (error: any) {
    console.error("Error saving notification preferences:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Changes the user's password.
 * Note: Supabase auth typically doesn't require the current password for this client-side update,
 * but including it might be intended for custom server-side verification if implemented.
 * @param currentPassword - The user's current password (potentially for server-side check).
 * @param newPassword - The desired new password.
 */
export const changeUserPassword = async (
  currentPassword: string, // Note: Supabase client updateUser doesn't typically use this
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
   console.log("Attempting to change user password...");
  try {
    // Check if user is authenticated (though updateUser should handle this)
    const { data: userData, error: authError } = await supabase.auth.getUser();
     if (authError || !userData?.user) {
       console.error("changeUserPassword: User not authenticated.", authError);
      throw new Error("User not authenticated");
    }

    // Use Supabase auth helper to update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      // 'data' field here is typically for metadata, not password verification on client
      // data: { currentPassword: currentPassword }, // This likely has no effect client-side
    });

    if (updateError) {
      console.error("Error updating user password via Supabase auth:", updateError);
      // Provide more specific error messages if possible
      let errorMessage = updateError.message;
      if (errorMessage.includes("weak password")) {
          errorMessage = "La nueva contraseña es demasiado débil.";
      } else if (errorMessage.includes("same password")) {
          errorMessage = "La nueva contraseña no puede ser igual a la anterior.";
      }
      return { success: false, error: errorMessage };
    }

    console.log(`Password updated successfully for user ${userData.user.id}.`);
    return { success: true };

  } catch (error: any) {
    console.error("Error changing user password:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};


// --- Functions below are mostly placeholders/simulations ---
// --- Replace with actual Supabase calls if functionality is needed ---

/**
 * Fetches a list of active user sessions (Simulated).
 * Requires server-side logic or specific Supabase features not typically exposed client-side.
 */
export const getUserSessions = async (): Promise<any[]> => {
  console.warn("getUserSessions: Function is simulated. Requires actual implementation.");
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error("User not authenticated");
    }

    // --- Simulation ---
    const sessions = [
      {
        id: "session-current", // Use a stable ID for the current session if possible
        device: "Este dispositivo (Chrome en Windows)", // Example
        location: "Ciudad de México (Estimada)", // Example
        ip_address: "192.168.1.100", // Example - Be cautious with IP exposure
        last_active: new Date().toISOString(),
        current: true,
      },
      {
        id: "session-old-1",
        device: "Safari en iPhone",
        location: "Guadalajara (Estimada)",
        ip_address: "10.0.0.5",
        last_active: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        current: false,
      },
    ];
    // --- End Simulation ---

    return sessions;
  } catch (error) {
    console.error("Error getting user sessions (simulated):", error);
    return [];
  }
};

/**
 * Closes a specific user session (Simulated).
 * Requires server-side implementation (e.g., using Supabase Admin SDK).
 * @param sessionId - The ID of the session to close.
 */
export const closeSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
   console.warn(`closeSession: Function is simulated. Requires actual implementation for session ID: ${sessionId}`);
  try {
     if (sessionId === "session-current") {
         return { success: false, error: "No puedes cerrar la sesión actual desde aquí." };
     }
    // --- Simulation ---
    console.log(`Simulating closing session with ID: ${sessionId}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    // --- End Simulation ---
    return { success: true };
  } catch (error: any) {
    console.error("Error closing session (simulated):", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Closes all other active user sessions (Simulated).
 * Requires server-side implementation (e.g., using Supabase Admin SDK and signOut).
 */
export const closeAllOtherSessions = async (): Promise<{ success: boolean; error?: string }> => {
   console.warn("closeAllOtherSessions: Function is simulated. Requires actual implementation.");
  try {
    // --- Simulation ---
    console.log("Simulating closing all other sessions.");
     await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    // In a real implementation, you'd call supabase.auth.signOut({ scope: 'others' })
    // or use the Admin SDK to revoke refresh tokens.
    // --- End Simulation ---
    return { success: true };
  } catch (error: any) {
    console.error("Error closing all other sessions (simulated):", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Fetches user activity history (Simulated).
 * Requires a dedicated 'activity_log' table or similar mechanism.
 * @param limit - Maximum number of history items to fetch.
 */
export const getActivityHistory = async (limit = 20): Promise<any[]> => {
  console.warn("getActivityHistory: Function is simulated. Requires actual implementation.");
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
     if (authError || !userData?.user) {
      throw new Error("User not authenticated");
    }

    // --- Simulation ---
    const history = [
      {
        id: "activity-1", activity_type: "login", description: "Inicio de sesión exitoso",
        ip_address: "192.168.1.100", created_at: new Date().toISOString(),
      },
      {
        id: "activity-2", activity_type: "profile_update", description: "Actualización de preferencias de notificación",
        ip_address: "192.168.1.100", created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
       {
        id: "activity-3", activity_type: "document_upload", description: "Subida de 'Factura_Abril.pdf'",
        ip_address: "192.168.1.100", created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
       {
        id: "activity-4", activity_type: "login_fail", description: "Intento de inicio de sesión fallido",
        ip_address: "187.1.2.3", created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];
    // --- End Simulation ---

    return history.slice(0, limit); // Apply limit
  } catch (error) {
    console.error("Error getting activity history (simulated):", error);
    return [];
  }
};

/**
 * Deletes the user's account (Simulated).
 * Requires significant server-side logic for proper data cleanup and security.
 */
export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
  console.warn("deleteUserAccount: Function is simulated. Requires actual server-side implementation.");
  try {
     // --- Simulation ---
     // 1. Confirm user identity (e.g., re-authenticate, enter password) - NOT IMPLEMENTED HERE
     // 2. Call a secure server-side function (e.g., Supabase Edge Function)
     console.log("Simulating request to delete user account...");
     await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
     // The server-side function would:
     // - Delete auth user (using Admin SDK)
     // - Delete profile data
     // - Delete storage data (documents, avatars)
     // - Delete other related data (reminders, shares, etc.)
     // --- End Simulation ---
    return { success: true }; // Simulate success
  } catch (error: any) {
    console.error("Error deleting user account (simulated):", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Signs the user out (Simulated - use useAuth hook instead).
 * This function is redundant if using the AuthProvider/useAuth hook, which handles sign-out.
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
   console.warn("signOut function in user-service is likely redundant. Use the signOut method from the useAuth() hook instead.");
  try {
      // Use the actual Supabase signout
      const { error } = await supabase.auth.signOut();
      if (error) {
          console.error("Error signing out via Supabase:", error);
          return { success: false, error: error.message };
      }
      console.log("User signed out successfully via Supabase.");
      return { success: true };
  } catch (error: any) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};
