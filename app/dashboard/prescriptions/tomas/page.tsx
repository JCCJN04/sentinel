import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { MedicationDosesClient } from './tomas-client';

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

export default async function TomasPage() {
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  // Obtener todas las dosis del usuario con información de medicamento
  const { data: doses } = await supabase
    .from('medication_doses')
    .select(`
      id,
      scheduled_at,
      taken_at,
      status,
      notes,
      created_at,
      prescription_medicine:prescription_medicines (
        id,
        medicine_name,
        dosage,
        instructions,
        prescription:prescriptions (
          id,
          doctor_name,
          diagnosis
        )
      )
    `)
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: false })
    .limit(100);

  return <MedicationDosesClient initialDoses={(doses || []) as any} />;
}
