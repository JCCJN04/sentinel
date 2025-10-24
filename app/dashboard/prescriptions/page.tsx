// app/dashboard/prescriptions/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Pill, 
  Calendar, 
  User, 
  ChevronRight, 
  Plus, 
  Camera,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PrescriptionsClient from '@/app/dashboard/prescriptions/prescriptions-client';

// Función helper para crear cliente de Supabase en el servidor
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

export default async function PrescriptionsPage() {
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  // Cargar recetas del usuario
  const { data: prescriptions, error } = await supabase
    .from('prescriptions')
    .select(`
      id,
      diagnosis,
      doctor_name,
      start_date,
      end_date,
      notes,
      created_at,
      prescription_medicines (
        id,
        medicine_name,
        dosage,
        frequency_hours,
        duration,
        instructions
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading prescriptions:', error);
  }

  // Mapear datos y agregar estado
  const mappedPrescriptions = (prescriptions || []).map((prescription: any) => {
    const today = new Date();
    const startDate = new Date(prescription.start_date);
    const endDate = prescription.end_date ? new Date(prescription.end_date) : null;

    let status = 'active';
    if (endDate && today > endDate) {
      status = 'completed';
    } else if (endDate && today <= endDate) {
      status = 'ongoing';
    }

    return {
      ...prescription,
      status,
      prescription_medicines: prescription.prescription_medicines || []
    };
  });

  return (
    <PrescriptionsClient prescriptions={mappedPrescriptions} />
  );
}