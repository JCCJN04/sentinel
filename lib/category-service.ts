// startupv2/lib/category-service.ts
// VERSIÓN CON 'updated_at' ELIMINADO (Opción 2)

import { createBrowserClient, SupabaseClient } from '@supabase/ssr';
import { type Document } from './document-service';

export interface Category {
  id: string;
  name: string;
  user_id: string | null;
  parent_id: string | null;
  created_at?: string;
  // updated_at?: string; // Eliminado
}

const getSupabaseClient = (): SupabaseClient => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or Anon Key is not defined. Check your .env.local file.");
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
    .select('id, name, user_id, parent_id, created_at'); // Eliminado updated_at

  if (user) {
    query = query.or(`user_id.eq.${user.id},user_id.is.null`);
  } else {
    query = query.is('user_id', null);
  }

  if (parentId === null) {
    query = query.is('parent_id', null);
  } else {
    query = query.eq('parent_id', parentId);
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

  let existingQuery = supabase.from('categories').select('id').eq('name', name).eq('user_id', user.id);
  if (parentId === null) {
    existingQuery = existingQuery.is('parent_id', null);
  } else {
    existingQuery = existingQuery.eq('parent_id', parentId);
  }
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) console.error('Error checking for existing category:', existingError);
  if (existing) throw new Error(`Ya existe una carpeta llamada "${name}" en esta ubicación.`);
  
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({ name: name, user_id: user.id, parent_id: parentId })
    .select('id, name, user_id, parent_id, created_at') // Eliminado updated_at
    .single();

  if (error) {
    console.error('Error adding category:', error.message, error.details);
    if (error.code === '23505') throw new Error(`La carpeta "${name}" ya existe o hay un conflicto de nombres.`);
    const specificMessage = error.details ? `${error.message} (${error.details})` : error.message;
    throw new Error(`No se pudo crear la nueva carpeta: ${specificMessage}`);
  }
  if (!newCategory) throw new Error('No se pudo crear la nueva carpeta (respuesta vacía).');
  return newCategory;
}

export async function renameCategory(categoryId: string, newName: string): Promise<Category> {
  const supabase = getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuario no autenticado.");
  }

  const { data: currentCategory, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, user_id, parent_id')
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error("Carpeta no encontrada o no tienes permiso para renombrarla.");
    throw new Error(`Error al obtener datos de la carpeta: ${fetchError.message}`);
  }
  if (!currentCategory) throw new Error("Carpeta no encontrada.");
  if (currentCategory.name === newName) return currentCategory;

  let existingQuery = supabase.from('categories').select('id').eq('name', newName).eq('user_id', user.id).neq('id', categoryId);
  if (currentCategory.parent_id === null) {
    existingQuery = existingQuery.is('parent_id', null);
  } else {
    existingQuery = existingQuery.eq('parent_id', currentCategory.parent_id);
  }
  const { data: existingSameName, error: checkError } = await existingQuery.maybeSingle();

  if (checkError) console.error("Error verificando nombre duplicado:", checkError);
  if (existingSameName) throw new Error(`Ya existe una carpeta llamada "${newName}" en esta ubicación.`);

  const { data: updatedCategory, error: updateError } = await supabase
    .from('categories')
    .update({ name: newName }) // Eliminado updated_at
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .select('id, name, user_id, parent_id, created_at') // Eliminado updated_at
    .single();

  if (updateError) {
    console.error('Error al renombrar la carpeta:', updateError);
    if (updateError.code === '23505') throw new Error(`El nombre de carpeta "${newName}" ya existe.`);
    throw new Error(`No se pudo renombrar la carpeta: ${updateError.message}`);
  }
  if (!updatedCategory) throw new Error('No se pudo renombrar la carpeta (respuesta vacía).');
  
  console.warn(`ADVERTENCIA: Carpeta "${currentCategory.name}" renombrada a "${newName}". Los documentos asociados por nombre no se actualizarán automáticamente por este servicio.`);
  return updatedCategory;
}

async function getAllDescendantCategories(supabase: SupabaseClient, parentId: string, userId: string): Promise<Pick<Category, 'id' | 'name'>[]> {
  let allDescendants: Pick<Category, 'id' | 'name'>[] = [];
  let queue: string[] = [parentId];
  
  while (queue.length > 0) {
    const currentParentId = queue.shift()!;
    const { data: subCategories, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .eq('parent_id', currentParentId);

    if (error) {
      console.error(`Error fetching subcategories for ${currentParentId}:`, error);
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

  const { data: mainCategoryData, error: fetchMainCatError } = await supabase
    .from('categories')
    .select('id, name, user_id')
    .eq('id', categoryIdToDelete)
    .eq('user_id', user.id)
    .single();

  if (fetchMainCatError) {
    if (fetchMainCatError.code === 'PGRST116') throw new Error("Carpeta no encontrada o no tienes permiso para eliminarla.");
    throw new Error(`Error al obtener datos de la carpeta: ${fetchMainCatError.message}`);
  }
  if (!mainCategoryData) throw new Error("Carpeta principal no encontrada.");

  const descendantCategories = await getAllDescendantCategories(supabase, categoryIdToDelete, user.id);
  const allCategoryIdsToDelete = [categoryIdToDelete, ...descendantCategories.map(c => c.id)];
  const allCategoryNamesToDelete = [mainCategoryData.name, ...descendantCategories.map(c => c.name)];

  if (allCategoryNamesToDelete.length > 0) {
    console.log("Eliminando documentos en carpetas:", allCategoryNamesToDelete.join(', '));
    const { error: deleteDocsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', user.id)
      .in('category', allCategoryNamesToDelete);

    if (deleteDocsError) {
      console.error(`Error al eliminar documentos de las carpetas: ${deleteDocsError.message}`);
    }
  }

  if (allCategoryIdsToDelete.length > 0) {
    console.log("Eliminando categorías con IDs:", allCategoryIdsToDelete.join(', '));
    const { error: deleteCatsError } = await supabase
      .from('categories')
      .delete()
      .in('id', allCategoryIdsToDelete)
      .eq('user_id', user.id);

    if (deleteCatsError) {
      console.error(`Error al eliminar carpetas: ${deleteCatsError.message}`);
      throw new Error(`No se pudieron eliminar todas las carpetas: ${deleteCatsError.message}`);
    }
  }
  console.log(`Carpeta "${mainCategoryData.name}" y su contenido eliminados exitosamente.`);
}