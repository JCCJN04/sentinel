'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Define un tipo unificado para las alertas que mostraremos en la UI
export type UnifiedAlert = {
  id: string;
  type: 'document_reminder' | 'family_activity' | 'security_alert';
  message: string;
  link: string | null;
  status: 'pendiente' | 'completada' | 'pospuesta' | 'info'; // 'info' para las que no se pueden completar
  created_at: string;
  original_table: 'document_reminders' | 'family_activity' | 'activity_history';
};

export async function getUnifiedAlertsForUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuario no autenticado', data: [] }
  }

  // 1. Obtener recordatorios de documentos
  const { data: reminders, error: remindersError } = await supabase
    .from('document_reminders')
    .select('*, documents(name)')
    .eq('user_id', user.id)

  if (remindersError) console.error('Error fetching reminders:', remindersError);

  // 2. Obtener actividad familiar
  const { data: familyActivities, error: familyError } = await supabase
    .from('family_activity')
    .select('*, family_members(member_name)')
    .eq('user_id', user.id)
    .limit(20)
    .order('created_at', { ascending: false });

  if (familyError) console.error('Error fetching family activity:', familyError);
  
  // 3. Obtener alertas de seguridad
  const { data: securityAlerts, error: securityError } = await supabase
    .from('activity_history')
    .select('*')
    .eq('user_id', user.id)
    .in('activity_type', ['login_success', 'password_change'])
    .limit(5)
    .order('created_at', { ascending: false });
  
  if (securityError) console.error('Error fetching security alerts:', securityError);

  // Mapear cada tipo a nuestro formato unificado
  const mappedReminders: UnifiedAlert[] = (reminders || []).map(r => ({
    id: r.id,
    type: 'document_reminder',
    message: `${r.title} (${r.documents?.name || 'Documento sin nombre'})`,
    link: `/dashboard/documentos/${r.document_id}`,
    status: r.status,
    created_at: r.created_at,
    original_table: 'document_reminders',
  }));

  const mappedFamily: UnifiedAlert[] = (familyActivities || []).map(fa => ({
    id: fa.id,
    type: 'family_activity',
    message: `${fa.family_members?.member_name || 'Un familiar'} ${fa.action}: ${fa.details || ''}`,
    link: fa.document_id ? `/dashboard/documentos/${fa.document_id}` : null,
    status: 'info', // Esta alerta es solo informativa
    created_at: fa.created_at,
    original_table: 'family_activity',
  }));
  
  const mappedSecurity: UnifiedAlert[] = (securityAlerts || []).map(sa => ({
    id: sa.id,
    type: 'security_alert',
    message: sa.description,
    link: '/dashboard/configuracion?tab=seguridad',
    status: 'info', // Esta alerta es solo informativa
    created_at: sa.created_at,
    original_table: 'activity_history',
  }));

  const allAlerts = [...mappedReminders, ...mappedFamily, ...mappedSecurity];
  allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { error: null, data: allAlerts };
}

// Acción para actualizar el estado de un recordatorio
export async function updateReminderStatus(reminderId: string, status: 'completada' | 'pospuesta') {
  const supabase = createClient()
  
  const updateData: { status: string, date?: string } = { status };

  if (status === 'pospuesta') {
    const {data: currentReminder} = await supabase.from('document_reminders').select('date').eq('id', reminderId).single();
    if(currentReminder) {
        const newDate = new Date(currentReminder.date);
        newDate.setDate(newDate.getDate() + 7);
        updateData.date = newDate.toISOString().split('T')[0];
    }
  }

  const { error } = await supabase
    .from('document_reminders')
    .update(updateData)
    .eq('id', reminderId);

  if (error) {
    return { success: false, error: 'No se pudo actualizar el recordatorio' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true }
}