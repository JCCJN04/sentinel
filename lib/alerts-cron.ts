/**
 * Funciones de cron para verificación automática de alertas
 * 
 * IMPORTANTE: Este archivo solo debe importarse desde:
 * - API Routes (/api/cron/*)
 * - Server-side code
 * 
 * NO importar desde componentes cliente
 */

import { createClient } from '@/lib/supabase/server';
import { generateAutoAlert } from './alerts-service';

/**
 * Verifica documentos próximos a vencer y genera alertas
 */
export async function checkExpiringDocuments(): Promise<void> {
  try {
    const supabase = createClient();
    
    // Documentos que vencen en los próximos 30 días
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringDocs, error } = await supabase
      .from('documents')
      .select('id, name, expiry_date, user_id')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('Error al verificar documentos expirando:', error);
      return;
    }

    // Generar alertas para cada documento
    for (const doc of expiringDocs || []) {
      await generateAutoAlert({
        event_type: 'document_expiring',
        user_id: doc.user_id,
        data: {
          document_id: doc.id,
          document_name: doc.name,
          expiry_date: doc.expiry_date,
        },
      });
    }
  } catch (error) {
    console.error('Error en checkExpiringDocuments:', error);
  }
}

/**
 * Verifica dosis de medicamentos pendientes y genera recordatorios
 */
export async function checkMedicationDoses(): Promise<void> {
  try {
    const supabase = createClient();
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: upcomingDoses, error } = await supabase
      .from('medication_doses')
      .select(`
        id,
        scheduled_at,
        user_id,
        prescription_medicine_id,
        prescription_medicines(
          medicine_name,
          dosage
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneHourFromNow.toISOString());

    if (error) {
      console.error('Error al verificar dosis de medicamentos:', error);
      return;
    }

    for (const dose of upcomingDoses || []) {
      await generateAutoAlert({
        event_type: 'medication_reminder',
        user_id: dose.user_id,
        data: {
          dose_id: dose.id,
          medicine_name: (dose.prescription_medicines as any)?.medicine_name,
          dosage: (dose.prescription_medicines as any)?.dosage,
          scheduled_at: dose.scheduled_at,
        },
      });
    }
  } catch (error) {
    console.error('Error en checkMedicationDoses:', error);
  }
}

/**
 * Función principal para ejecutar todas las verificaciones automáticas
 * Esta función debería ser llamada por un cron job o tarea programada
 */
export async function runAutomaticAlertChecks(): Promise<void> {
  console.log('Ejecutando verificaciones automáticas de alertas...');
  
  await Promise.all([
    checkExpiringDocuments(),
    checkMedicationDoses(),
  ]);
  
  console.log('Verificaciones automáticas completadas');
}

/**
 * Limpia alertas antiguas completadas (más de 90 días)
 */
export async function cleanupOldAlerts(): Promise<void> {
  try {
    const supabase = createClient();
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Usar la función de base de datos creada anteriormente
    const { error } = await supabase.rpc('cleanup_old_alerts');

    if (error) {
      console.error('Error al limpiar alertas antiguas:', error);
    } else {
      console.log('Alertas antiguas limpiadas correctamente');
    }
  } catch (error) {
    console.error('Error en cleanupOldAlerts:', error);
  }
}
