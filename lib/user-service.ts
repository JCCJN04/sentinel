// Import the browser client
import { supabaseBrowserClient as supabase } from "./supabase";
import type { Database } from './database.types';

// =================================================================
// INTERFACES Y VALORES POR DEFECTO
// =================================================================

// Interfaz de perfil de usuario, usando first_name y last_name
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url: string;
  language: string;
  timezone: string;
  date_format: string;
  notification_preferences: NotificationPreferences;
  last_active: string;
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


// =================================================================
// FUNCIONES DE PERFIL (CORREGIDAS Y FUNCIONALES)
// =================================================================

/**
 * Obtiene el perfil del usuario autenticado.
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("getUserProfile: Usuario no autenticado.");
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profileData) {
      return {
        id: user.id,
        first_name: "",
        last_name: "",
        email: user.email || "",
        avatar_url: "",
        language: "es",
        timezone: "America/Mexico_City",
        date_format: "DD/MM/YYYY",
        notification_preferences: defaultNotificationPreferences,
        last_active: user.last_sign_in_at || new Date().toISOString(),
      };
    }

    return {
      id: profileData.id,
      first_name: profileData.first_name || "",
      last_name: profileData.last_name || "",
      email: user.email || "",
      avatar_url: profileData.avatar_url || "",
      language: profileData.language || "es",
      timezone: profileData.timezone || "America/Mexico_City",
      date_format: profileData.date_format || "DD/MM/YYYY",
      notification_preferences: {
        ...defaultNotificationPreferences,
        ...(profileData.notification_preferences as Partial<NotificationPreferences> || {}),
      },
      last_active: profileData.last_active || user.last_sign_in_at || new Date().toISOString(),
    };

  } catch (error) {
    console.error("Error en getUserProfile:", error);
    return null;
  }
};


/**
 * Actualiza el perfil del usuario o lo crea si no existe (upsert).
 * ¡ESTA ES LA VERSIÓN CORREGIDA!
 */
export const updateUserProfile = async (
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'last_active'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Para un 'upsert', debemos incluir el 'id' del usuario en el objeto
    const profileData = {
        ...updates,
        id: user.id, // La clave primaria es necesaria para el upsert
        updated_at: new Date().toISOString(),
    };

    // Usamos .upsert() para crear el perfil si no existe, o actualizarlo si ya existe.
    // Esto soluciona el error PGRST116 para nuevos usuarios.
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData);

    if (upsertError) {
      console.error("Error detallado de Supabase al hacer upsert:", JSON.stringify(upsertError, null, 2));
      const errorMessage = `Error de base de datos: ${upsertError.message}.`;
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Excepción en updateUserProfile:", error);
    return { success: false, error: error.message || "Ocurrió un error desconocido" };
  }
};

/**
 * Sube un nuevo avatar para el usuario.
 */
export const updateUserAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/avatar-${user.id}-${new Date().getTime()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!publicUrl) throw new Error("No se pudo obtener la URL pública del avatar.");

        // Usamos upsert también aquí por si el perfil no existe al momento de subir la foto.
        const { error: updateError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });
        if (updateError) throw updateError;

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error("Error al actualizar el avatar:", error);
        return { success: false, error: error.message || "Ocurrió un error desconocido" };
    }
}


// =================================================================
// FUNCIONES ADICIONALES (CONSERVADAS Y MODIFICADAS)
// =================================================================

export const saveNotificationPreferences = async (
  preferences: NotificationPreferences,
): Promise<{ success: boolean; error?: string }> => {
  console.log("Guardando preferencias de notificación:", preferences);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // Usar upsert aquí también para robustez
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, notification_preferences: preferences, updated_at: new Date().toISOString() });

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    console.log(`Preferencias de notificación actualizadas para el usuario ${user.id}.`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error desconocido" };
  }
};

export const changeUserPassword = async (
  currentPassword: string, // Added to match the call in security-settings.tsx
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  console.log("Intentando cambiar la contraseña...");
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // NOTE: Supabase's client-side updateUser does not verify currentPassword.
    // If strict current password verification is required, it should be done
    // by re-authenticating the user (e.g., supabase.auth.signInWithPassword)
    // or through a server-side function.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      let errorMessage = updateError.message;
      if (errorMessage.includes("weak password")) {
          errorMessage = "La nueva contraseña es demasiado débil.";
      } else if (errorMessage.includes("same password")) {
          errorMessage = "La nueva contraseña no puede ser igual a la anterior.";
      }
      return { success: false, error: errorMessage };
    }
    console.log(`Contraseña actualizada para el usuario ${user.id}.`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error desconocido" };
  }
};

export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  console.log("Intentando cerrar sesión desde user-service...");
  try {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      return { success: false, error: signOutError.message };
    }
    console.log("Sesión cerrada correctamente desde user-service.");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error desconocido al cerrar sesión" };
  }
};


// =================================================================
// FUNCIONES SIMULADAS (CONSERVADAS Y NUEVAS)
// =================================================================

export const getUserSessions = async (): Promise<any[]> => {
  console.warn("getUserSessions: Función es simulada.");
  return [
    { id: "session-current", device: "Este dispositivo (Chrome en Windows)", location: "Ciudad de México", last_active: new Date().toISOString(), current: true },
    { id: "session-old-1", device: "Safari en iPhone", location: "Guadalajara", last_active: new Date(Date.now() - 86400000 * 2).toISOString(), current: false },
  ];
};

export const closeSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    console.warn(`closeSession: Función es simulada para session ID: ${sessionId}`);
   if (sessionId === "session-current") return { success: false, error: "No puedes cerrar la sesión actual." };
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
};

export const closeAllOtherSessions = async (): Promise<{ success: boolean; error?: string }> => {
    console.warn("closeAllOtherSessions: Función es simulada.");
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
};

export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
  console.warn("deleteUserAccount: Función es simulada.");
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error desconocido" };
  }
};

export const getActivityHistory = async (limit: number = 10): Promise<any[]> => {
  console.warn("getActivityHistory: Función es simulada.");
  // Simulate fetching recent activity
  const simulatedActivities = [
    { id: "act-1", activity_type: "login", description: "Inicio de sesión desde Chrome en Windows", ip_address: "192.168.1.100", created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: "act-2", activity_type: "profile_update", description: "Actualización de perfil (Nombre)", ip_address: "192.168.1.100", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: "act-3", activity_type: "security_update", description: "Cambio de contraseña", ip_address: "192.168.1.101", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: "act-4", activity_type: "document_upload", description: "Documento subido: Receta_Medica.pdf", ip_address: "192.168.1.100", created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() },
    { id: "act-5", activity_type: "login", description: "Inicio de sesión desde Safari en iPhone", ip_address: "10.0.0.5", created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  ];
  return simulatedActivities.slice(0, limit);
};