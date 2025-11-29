'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Define un tipo unificado para las alertas que mostraremos en la UI
export type UnifiedAlert = {
  id: string;
  type: 'document_reminder' | 'family_activity' | 'security_alert' | 'custom' | 'medication' | 'vaccine' | 'appointment' | 'insurance';
  message: string;
  link: string | null;
  status: 'pendiente' | 'completada' | 'pospuesta' | 'info' | 'cancelada';
  priority?: 'baja' | 'media' | 'alta' | 'crítica';
  is_read?: boolean;
  created_at: string;
  original_table: 'document_reminders' | 'family_activity' | 'activity_history' | 'custom_alerts';
};

export type CreateCustomAlertParams = {
  title: string;
  message: string;
  type?: string;
  priority?: 'baja' | 'media' | 'alta' | 'crítica';
  link?: string;
  trigger_date?: string;
  expiry_date?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: string;
  };
  metadata?: Record<string, any>;
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

  // 4. Obtener alertas personalizadas
  const { data: customAlerts, error: customError } = await supabase
    .from('custom_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (customError) console.error('Error fetching custom alerts:', customError);

  // Mapear cada tipo a nuestro formato unificado
  const mappedReminders: UnifiedAlert[] = (reminders || []).map(r => ({
    id: r.id,
    type: 'document_reminder',
    message: `${r.title} (${r.documents?.name || 'Documento sin nombre'})`,
    link: `/dashboard/documentos/${r.document_id}`,
    status: r.status,
    priority: r.priority as 'baja' | 'media' | 'alta' | 'crítica',
    is_read: true,
    created_at: r.created_at,
    original_table: 'document_reminders',
  }));

  const mappedFamily: UnifiedAlert[] = (familyActivities || []).map(fa => ({
    id: fa.id,
    type: 'family_activity',
    message: `${fa.family_members?.member_name || 'Un familiar'} ${fa.action}: ${fa.details || ''}`,
    link: fa.document_id ? `/dashboard/documentos/${fa.document_id}` : null,
    status: 'info',
    is_read: true,
    created_at: fa.created_at,
    original_table: 'family_activity',
  }));
  
  const mappedSecurity: UnifiedAlert[] = (securityAlerts || []).map(sa => ({
    id: sa.id,
    type: 'security_alert',
    message: sa.description,
    link: '/dashboard/configuracion?tab=seguridad',
    status: 'info',
    is_read: true,
    created_at: sa.created_at,
    original_table: 'activity_history',
  }));

  const mappedCustom: UnifiedAlert[] = (customAlerts || []).map(ca => ({
    id: ca.id,
    type: ca.type as any,
    message: ca.message,
    link: ca.link,
    status: ca.status,
    priority: ca.priority as 'baja' | 'media' | 'alta' | 'crítica',
    is_read: ca.is_read,
    created_at: ca.created_at,
    original_table: 'custom_alerts',
  }));

  const allAlerts = [...mappedReminders, ...mappedFamily, ...mappedSecurity, ...mappedCustom];
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

// Crear una alerta personalizada
export async function createCustomAlert(params: CreateCustomAlertParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  const { error } = await supabase
    .from('custom_alerts')
    .insert({
      user_id: user.id,
      title: params.title,
      message: params.message,
      type: params.type || 'custom',
      priority: params.priority || 'media',
      link: params.link,
      trigger_date: params.trigger_date,
      expiry_date: params.expiry_date,
      recurrence: params.recurrence,
      metadata: params.metadata || {},
    });

  if (error) {
    console.error('Error creating custom alert:', error);
    return { success: false, error: 'No se pudo crear la alerta' }
  }

  revalidatePath('/dashboard/alertas')
  return { success: true }
}

// Actualizar el estado de una alerta personalizada
export async function updateCustomAlertStatus(alertId: string, status: 'completada' | 'pospuesta' | 'cancelada') {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('custom_alerts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) {
    return { success: false, error: 'No se pudo actualizar la alerta' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true }
}

// Marcar alertas como leídas
export async function markAlertsAsRead(alertIds: string[]) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('custom_alerts')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .in('id', alertIds);

  if (error) {
    return { success: false, error: 'No se pudieron marcar las alertas como leídas' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true }
}

// Eliminar una alerta personalizada
export async function deleteCustomAlert(alertId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('custom_alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    return { success: false, error: 'No se pudo eliminar la alerta' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true }
}

// Eliminar alertas en lote
export async function deleteMultipleAlerts(alertIds: string[], table: 'custom_alerts' | 'document_reminders' = 'custom_alerts') {
  const supabase = createClient()
  
  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', alertIds);

  if (error) {
    return { success: false, error: 'No se pudieron eliminar las alertas' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true }
}

// Obtener estadísticas de alertas
export async function getAlertStats() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuario no autenticado', data: null }
  }

  // Contar alertas por estado
  const { data: customAlerts } = await supabase
    .from('custom_alerts')
    .select('status, priority, is_read')
    .eq('user_id', user.id);

  const { data: documentReminders } = await supabase
    .from('document_reminders')
    .select('status, priority')
    .eq('user_id', user.id);

  const allAlerts = [...(customAlerts || []), ...(documentReminders || [])];

  const stats = {
    total: allAlerts.length,
    pending: allAlerts.filter(a => a.status === 'pendiente').length,
    completed: allAlerts.filter(a => a.status === 'completada').length,
    postponed: allAlerts.filter(a => a.status === 'pospuesta').length,
    unread: (customAlerts || []).filter(a => !a.is_read).length,
    byPriority: {
      crítica: allAlerts.filter(a => a.priority === 'crítica').length,
      alta: allAlerts.filter(a => a.priority === 'alta').length,
      media: allAlerts.filter(a => a.priority === 'media').length,
      baja: allAlerts.filter(a => a.priority === 'baja').length,
    }
  };

  return { error: null, data: stats };
}

// Posponer una alerta temporalmente (snooze)
export async function snoozeAlert(
  alertId: string, 
  snoozeDuration: '1hour' | '3hours' | '1day' | '3days' | '1week'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }
  
  const now = new Date();
  const snoozeUntil = new Date(now);
  
  switch (snoozeDuration) {
    case '1hour':
      snoozeUntil.setHours(now.getHours() + 1);
      break;
    case '3hours':
      snoozeUntil.setHours(now.getHours() + 3);
      break;
    case '1day':
      snoozeUntil.setDate(now.getDate() + 1);
      break;
    case '3days':
      snoozeUntil.setDate(now.getDate() + 3);
      break;
    case '1week':
      snoozeUntil.setDate(now.getDate() + 7);
      break;
  }
  
  // Obtener metadata actual
  const { data: currentAlert } = await supabase
    .from('custom_alerts')
    .select('metadata')
    .eq('id', alertId)
    .eq('user_id', user.id)
    .single();
  
  const updatedMetadata = {
    ...(currentAlert?.metadata || {}),
    snoozed_at: now.toISOString(),
    snooze_duration: snoozeDuration,
    snooze_until: snoozeUntil.toISOString()
  };
  
  const { error } = await supabase
    .from('custom_alerts')
    .update({ 
      status: 'pospuesta',
      trigger_date: snoozeUntil.toISOString(),
      metadata: updatedMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .eq('user_id', user.id);
  
  if (error) {
    return { success: false, error: 'No se pudo posponer la alerta' }
  }
  
  revalidatePath('/dashboard/alertas')
  return { success: true, snoozeUntil: snoozeUntil.toISOString() }
}