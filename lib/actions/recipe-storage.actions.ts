// lib/actions/recipe-storage.actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const createSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { }
        },
        remove: (name: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { }
        },
      },
    }
  );
};

/**
 * Genera la ruta inteligente: {user_id}/recetas/YYYY/MM/
 * Ejemplo: 123e4567-e89b-12d3-a456-426614174000/recetas/2025/10/ para octubre 2025
 * Organiza por usuario para mejor privacidad y mantenimiento
 */
function generateRecipeStoragePath(userId: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${userId}/recetas/${year}/${month}`;
}

/**
 * Genera un nombre de archivo único
 * Ejemplo: receta_2025_10_23_150230_abc123.jpg
 */
function generateFileName(originalFileName: string, timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  const ext = originalFileName.split('.').pop() || 'jpg';
  return `receta_${year}${month}${day}_${hours}${minutes}${seconds}_${randomSuffix}.${ext}`;
}

/**
 * Sube una imagen de receta a Supabase Storage
 * Crea la estructura de carpetas automáticamente
 * Retorna: { url: string; path: string; fileName: string; uploadedAt: string }
 */
export async function uploadRecipeImage(
  base64Image: string,
  originalFileName: string = 'receta.jpg'
): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  uploadedAt?: string;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Convertir base64 a Uint8Array (para Supabase)
    let imageData: Uint8Array;
    if (base64Image.startsWith('data:')) {
      const base64Data = base64Image.split(',')[1];
      imageData = new Uint8Array(Buffer.from(base64Data, 'base64'));
    } else {
      imageData = new Uint8Array(Buffer.from(base64Image, 'base64'));
    }

    console.log('✅ Imagen convertida:', {
      size: imageData.length,
      type: imageData.constructor.name
    });

    // Generar rutas inteligentes
    const now = new Date();
    const storagePath = generateRecipeStoragePath(user.id, now);
    const fileName = generateFileName(originalFileName, now);
    const fullPath = `${storagePath}/${fileName}`;

    console.log('📁 Generando estructura:', {
      userId: user.id,
      storagePath,
      fileName,
      fullPath,
      timestamp: now.toISOString()
    });

    // Validar que fullPath no esté vacío
    if (!fullPath || fullPath.trim() === '') {
      return { success: false, error: 'Ruta de archivo vacía' };
    }

    // Validar que imageData no esté vacío
    if (!imageData || imageData.length === 0) {
      return { success: false, error: 'Imagen vacía o corrupta' };
    }

    // Subir a Storage (usando el bucket 'documents' que ya existe)
    console.log('🚀 Iniciando upload a Supabase...');
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fullPath, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Error al subir archivo:', {
        error: uploadError,
        message: uploadError.message,
        fullPath,
        imageSize: imageData.length
      });
      
      // Mensaje de error más descriptivo
      let errorMsg = uploadError.message || 'Error desconocido al subir imagen';
      if (uploadError.message?.includes('Bucket not found')) {
        errorMsg = 'El bucket "documents" no existe. Por favor verifica en Supabase que existe.';
      } else if (uploadError.message?.includes('Access Denied')) {
        errorMsg = 'Acceso denegado. Verifica las políticas RLS del bucket.';
      } else if (uploadError.message?.includes('CORS')) {
        errorMsg = 'Error CORS. Verifica la configuración de Supabase.';
      } else if (uploadError.message?.includes('401')) {
        errorMsg = 'No autorizado. Verifica tu token de autenticación.';
      }
      
      return { success: false, error: errorMsg };
    }

    console.log('✅ Archivo subido exitosamente:', {
      path: data?.path,
      fullPath
    });

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fullPath);

    console.log('✅ URL pública generada:', {
      fileName,
      url: urlData.publicUrl
    });

    return {
      success: true,
      url: urlData.publicUrl,
      path: fullPath,
      fileName,
      uploadedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('💥 Error en uploadRecipeImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir imagen'
    };
  }
}

/**
 * Obtiene la URL de una imagen de receta
 */
export async function getRecipeImageUrl(path: string): Promise<{
  success: boolean;
  url?: string;
  signedUrl?: string;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // URL pública
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    // URL firmada (válida por 1 hora)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600);

    if (signedError) {
      console.error('Error al crear URL firmada:', signedError);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      signedUrl: signedUrlData?.signedUrl,
    };
  } catch (error) {
    console.error('Error en getRecipeImageUrl:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Lista todas las recetas de un usuario
 */
export async function listRecipesByUser(year?: number, month?: number): Promise<{
  success: boolean;
  recipes?: Array<{
    name: string;
    path: string;
    size: number;
    updatedAt: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Listar archivos en recetas/
    let searchPath = 'recetas';
    if (year) {
      searchPath = `recetas/${year}`;
      if (month) {
        const monthStr = String(month).padStart(2, '0');
        searchPath = `recetas/${year}/${monthStr}`;
      }
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .list(searchPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      });

    if (error) {
      console.error('Error al listar recetas:', error);
      return { success: false, error: error.message };
    }

    const recipes = (data || [])
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => ({
        name: file.name,
        path: `${searchPath}/${file.name}`,
        size: file.metadata?.size || 0,
        updatedAt: file.updated_at,
      }));

    return { success: true, recipes };
  } catch (error) {
    console.error('Error en listRecipesByUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene información de carpetas de recetas disponibles
 */
export async function getRecipeFolderStructure(): Promise<{
  success: boolean;
  structure?: Array<{
    year: number;
    months: number[];
  }>;
  error?: string;
}> {
  try {
    const supabase = createSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Listar carpetas de años
    const { data: yearsData, error: yearsError } = await supabase.storage
      .from('documents')
      .list('recetas', { limit: 100 });

    if (yearsError) {
      console.error('Error al listar años:', yearsError);
      return { success: false, error: yearsError.message };
    }

    const structure: Array<{ year: number; months: number[] }> = [];

    for (const yearFolder of yearsData || []) {
      if (yearFolder.name === '.emptyFolderPlaceholder') continue;

      const year = parseInt(yearFolder.name);
      if (isNaN(year)) continue;

      const { data: monthsData } = await supabase.storage
        .from('documents')
        .list(`recetas/${year}`, { limit: 100 });

      const months = (monthsData || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => parseInt(f.name))
        .filter(m => !isNaN(m))
        .sort((a, b) => a - b);

      if (months.length > 0) {
        structure.push({ year, months });
      }
    }

    return {
      success: true,
      structure: structure.sort((a, b) => b.year - a.year),
    };
  } catch (error) {
    console.error('Error en getRecipeFolderStructure:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
