// lib/category-service.ts
import { supabaseBrowserClient as supabase } from "./supabase";

export interface Category {
  id: string;
  name: string;
  user_id: string | null;
  parent_id: string | null;
  created_at: string;
}

/**
 * Fetches categories for a user.
 * Can fetch all categories or just those under a specific parent.
 * @param parentId The ID of the parent category. If null, fetches top-level categories.
 * @param fetchAll If true, ignores parentId and fetches all categories for the user.
 * @returns A promise that resolves to an array of categories.
 */
export async function getCategoriesForUser(parentId: string | null = null, fetchAll: boolean = false): Promise<Category[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  let query = supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`); // User's categories + global ones

  if (fetchAll) {
    // No additional filters needed, query will fetch all for the user
  } else {
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  return data || [];
}


export async function addCategoryForUser(name: string, parentId: string | null = null): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("User not authenticated.");
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name,
            user_id: user.id,
            parent_id: parentId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding category:", error);
        throw error;
    }
    return data;
}

export async function renameCategory(id: string, newName: string): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        console.error("Error renaming category:", error);
        throw error;
    }
    return data;
}

export async function deleteCategoryAndContents(categoryId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_category_and_children', {
        p_category_id: categoryId
    });

    if (error) {
        console.error('Error deleting category and contents:', error);
        throw new Error('Failed to delete category and its contents.');
    }
}