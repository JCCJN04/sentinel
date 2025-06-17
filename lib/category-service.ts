// /lib/category-service.ts

import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
// Asegúrate que la ruta a document-service es correcta desde la perspectiva de este archivo
import { type Document } from './document-service';

export interface Category {
  id: string;
  name: string;
  user_id: string | null; // Puede ser null para carpetas globales/predefinidas
  parent_id: string | null;
  created_at?: string;
}

let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is not defined. Check your .env.local file.");
  }
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export async function getCategoriesForUser(parentId: string | null = null): Promise<Category[]> {
  const supabase = getSupabaseClient();
  const { data: { user }, error: authUserError } = await supabase.auth.getUser();

  if (authUserError) {
    console.error('Error fetching auth user in getCategoriesForUser:', authUserError.message);
    throw new Error('No se pudo verificar el usuario para obtener carpetas.');
  }

  let query = supabase
    .from('categories')
    .select('id, name, user_id, parent_id, created_at');

  if (user) {
    // Muestra carpetas del usuario Y carpetas globales (user_id IS NULL)
    query = query.or(`user_id.eq.${user.id},user_id.is.null`);
  } else {
    // Si no hay usuario (ej. vista pública), solo muestra carpetas globales
    query = query.is('user_id', null);
  }

  if (parentId === null) {
    query = query.is('parent_id', null); // Carpetas raíz
  } else {
    query = query.eq('parent_id', parentId); // Subcarpetas
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error.message, error.details);
    const specificMessage = error.details ? `${error.message} (${error.details})` : error.message;
    throw new Error(`No se pudieron obtener las carpetas: ${specificMessage}`);
  }
  return data || [];
}

export async function addCategoryForUser(name: string, parentId: string | null = null): Promise<Category> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado. No se puede crear la carpeta.');
  }

  // Verifica si ya existe una carpeta con el mismo nombre, user_id y parent_id
  let existingQuery = supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .eq('user_id', user.id); // Las carpetas creadas por usuarios siempre tienen su user_id

  if (parentId === null) {
    existingQuery = existingQuery.is('parent_id', null);
  } else {
    existingQuery = existingQuery.eq('parent_id', parentId);
  }
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    console.error('Error checking for existing category:', existingError);
    // No lanzar error aquí, permitir continuar y dejar que el insert falle si es un problema real
  }
  if (existing) {
    throw new Error(`Ya existe una carpeta llamada "${name}" en esta ubicación para este usuario.`);
  }

  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({ name: name, user_id: user.id, parent_id: parentId }) // Las nuevas carpetas siempre son del usuario
    .select('id, name, user_id, parent_id, created_at')
    .single();

  if (error) {
    console.error('Error adding category:', error.message, error.details);
    if (error.code === '23505') { // unique_violation
        throw new Error(`La carpeta "${name}" ya existe o hay un conflicto de nombres (código: 23505).`);
    }
    const specificMessage = error.details ? `${error.message} (${error.details})` : error.message;
    throw new Error(`No se pudo crear la nueva carpeta: ${specificMessage}`);
  }
  if (!newCategory) {
    throw new Error('No se pudo crear la nueva carpeta (respuesta vacía del servidor).');
  }
  return newCategory;
}

export async function renameCategory(categoryId: string, newName: string): Promise<Category> {
  const supabase = getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado para renombrar carpeta.");
  }

  // Obtener la categoría que se va a renombrar
  const { data: currentCategory, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, user_id, parent_id, created_at')
    .eq('id', categoryId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error("Carpeta no encontrada.");
    throw new Error(`Error al obtener datos de la carpeta: ${fetchError.message}`);
  }
  if (!currentCategory) throw new Error("Carpeta no encontrada.");

  // Verificación de permisos: solo el dueño puede renombrar sus carpetas.
  // Las carpetas globales (user_id IS NULL) no deberían ser renombrables por esta función por usuarios regulares.
  if (currentCategory.user_id !== user.id) {
      throw new Error("No tienes permiso para renombrar esta carpeta (no es tuya o es una carpeta global).");
  }
  
  const fullyTypedCurrentCategory: Category = currentCategory as Category;
  if (fullyTypedCurrentCategory.name === newName) return fullyTypedCurrentCategory;

  // Verificar si ya existe otra carpeta con el nuevo nombre en la misma ubicación y para el mismo usuario
  let existingQuery = supabase
    .from('categories')
    .select('id')
    .eq('name', newName)
    .eq('user_id', user.id) // Importante: el nuevo nombre no debe colisionar con OTRA de MIS carpetas
    .neq('id', categoryId); // Excluir la carpeta actual

  if (fullyTypedCurrentCategory.parent_id === null) {
    existingQuery = existingQuery.is('parent_id', null);
  } else {
    existingQuery = existingQuery.eq('parent_id', fullyTypedCurrentCategory.parent_id);
  }
  const { data: existingSameName, error: checkError } = await existingQuery.maybeSingle();

  if (checkError) {
    console.error("Error verificando nombre duplicado al renombrar:", checkError);
  }
  if (existingSameName) {
    throw new Error(`Ya existe otra carpeta llamada "${newName}" en esta ubicación.`);
  }

  const { data: updatedCategoryData, error: updateError } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('id', categoryId)
    .eq('user_id', user.id) // Doble check de seguridad: solo actualiza si soy el dueño
    .select('id, name, user_id, parent_id, created_at')
    .single();

  if (updateError) {
    console.error('Error al renombrar la carpeta:', updateError);
    if (updateError.code === '23505') throw new Error(`El nombre de carpeta "${newName}" ya existe (conflicto).`);
    throw new Error(`No se pudo renombrar la carpeta: ${updateError.message}`);
  }
  if (!updatedCategoryData) throw new Error('No se pudo renombrar la carpeta (respuesta vacía del servidor).');

  console.warn(`ADVERTENCIA: Carpeta "${fullyTypedCurrentCategory.name}" renombrada a "${newName}".`);
  return updatedCategoryData as Category;
}

async function getAllDescendantCategories(
  supabase: SupabaseClient,
  parentId: string,
  ownerUserId: string | null
): Promise<Pick<Category, 'id' | 'name'>[]> {
  let allDescendants: Pick<Category, 'id' | 'name'>[] = [];
  let queue: string[] = [parentId];

  while (queue.length > 0) {
    const currentParentIdToQuery = queue.shift()!;
    let query = supabase
      .from('categories')
      .select('id, name')
      .eq('parent_id', currentParentIdToQuery);

    if (ownerUserId === null) {
      query = query.is('user_id', null);
    } else {
      query = query.eq('user_id', ownerUserId);
    }

    const { data: subCategories, error } = await query;

    if (error) {
      console.error(`Error al obtener subcarpetas para el padre ${currentParentIdToQuery}:`, error);
      continue; 
    }

    if (subCategories && subCategories.length > 0) {
      allDescendants = allDescendants.concat(subCategories);
      queue = queue.concat(subCategories.map(sc => sc.id));
    }
  }
  return allDescendants;
}

export async function deleteCategoryAndContents(categoryIdToDelete: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado para eliminar carpeta.");
  }

  // 1. Obtener la categoría a eliminar
  const { data: mainCategoryData, error: fetchMainCatError } = await supabase
    .from('categories')
    .select('id, name, user_id')
    .eq('id', categoryIdToDelete)
    .maybeSingle();

  if (fetchMainCatError) {
    console.error("Error al buscar la carpeta a eliminar:", fetchMainCatError);
    throw new Error(`Error al obtener datos de la carpeta: ${fetchMainCatError.message}`);
  }

  if (!mainCategoryData) {
    throw new Error("Carpeta no encontrada.");
  }

  // 2. Verificación de Permisos
  if (mainCategoryData.user_id !== null && mainCategoryData.user_id !== user.id) {
    throw new Error("No tienes permiso para eliminar esta carpeta (no te pertenece).");
  }

  // 3. Obtener todas las categorías descendientes
  const descendantCategories = await getAllDescendantCategories(supabase, categoryIdToDelete, mainCategoryData.user_id);
  
  const allCategoryIdsToDelete = [categoryIdToDelete, ...descendantCategories.map(c => c.id)];
  const allCategoryNamesToDelete = [mainCategoryData.name, ...descendantCategories.map(c => c.name)];

  // 4. Eliminar documentos asociados
  if (allCategoryNamesToDelete.length > 0) {
    console.log(`Eliminando documentos del usuario en carpetas: ${allCategoryNamesToDelete.join(', ')}`);
    const { error: deleteDocsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', user.id)
      .in('category', allCategoryNamesToDelete);

    if (deleteDocsError) {
      console.error(`Error al eliminar documentos: ${deleteDocsError.message}`);
      throw new Error(`Fallo al eliminar documentos: ${deleteDocsError.message}. La eliminación de la carpeta fue cancelada.`);
    }
  }

  // 5. Eliminar las categorías
  if (allCategoryIdsToDelete.length > 0) {
    console.log("Eliminando categorías con IDs:", allCategoryIdsToDelete.join(', '));
    let deleteCatsQuery = supabase
      .from('categories')
      .delete()
      .in('id', allCategoryIdsToDelete);

    if (mainCategoryData.user_id === null) {
      deleteCatsQuery = deleteCatsQuery.is('user_id', null);
    } else {
      deleteCatsQuery = deleteCatsQuery.eq('user_id', user.id);
    }

    const { error: deleteCatsError } = await deleteCatsQuery;

    if (deleteCatsError) {
      console.error(`Error al eliminar categorías: ${deleteCatsError.message}`);
      throw new Error(`No se pudieron eliminar todas las carpetas: ${deleteCatsError.message}.`);
    }
  }
  console.log(`Carpeta "${mainCategoryData.name}" y su contenido eliminados exitosamente.`);
}