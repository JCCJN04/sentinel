/**
 * Funciones de cron para verificación automática de alertas
 * 
 * IMPORTANTE: Este archivo solo debe importarse desde:
 * - API Routes (/api/cron/*)
 * - Server-side code
 * 
 * NO importar desde componentes cliente
 */

import { createServiceClient } from '@/lib/supabase/server';
import { generateAutoAlert } from './alerts-service';
import { sendMedicationReminder, sendDocumentAlert } from './whatsapp-service';

/**
 * Verifica documentos próximos a vencer y genera alertas
 * También envía notificaciones por WhatsApp si el usuario lo tiene habilitado
 */
export async function checkExpiringDocuments(): Promise<void> {
  try {
    const supabase = createServiceClient();
    
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

      // Verificar si el usuario tiene WhatsApp habilitado
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, whatsapp_notifications_enabled')
        .eq('id', doc.user_id)
        .single();

      if (profile?.whatsapp_notifications_enabled && profile?.phone_number) {
        const userName = profile.first_name || profile.last_name || 'Usuario';
        
        // Formatear fecha de vencimiento
        const expiryDate = new Date(doc.expiry_date);
        const formattedDate = expiryDate.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        // Calcular días restantes
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Solo enviar si faltan 30, 15, 7 o 3 días (evitar spam)
        if ([30, 15, 7, 3].includes(daysRemaining)) {
          const result = await sendDocumentAlert(
            profile.phone_number,
            userName,
            doc.name,
            formattedDate
          );

          if (result.success) {
            console.log(`✅ [WhatsApp] Alerta de documento enviada a ${profile.phone_number}`);
          } else {
            console.error(`❌ [WhatsApp] Error enviando alerta:`, result.error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error en checkExpiringDocuments:', error);
  }
}

/**
 * Verifica dosis de medicamentos pendientes y genera recordatorios
 * También envía notificaciones por WhatsApp si el usuario lo tiene habilitado
 */
export async function checkMedicationDoses(): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    // IMPORTANTE: Usar UTC para evitar problemas de zona horaria
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Convertir a formato ISO compatible con PostgreSQL timestamptz
    const nowISO = now.toISOString();
    const oneHourISO = oneHourFromNow.toISOString();

    console.log('[checkMedicationDoses] Buscando dosis entre:', {
      desde: nowISO,
      hasta: oneHourISO,
      now_utc: now.toUTCString()
    });

    console.log('[checkMedicationDoses] Buscando dosis entre:', {
      desde: nowISO,
      hasta: oneHourISO,
      now_utc: now.toUTCString()
    });

    const { data: upcomingDoses, error } = await supabase
      .from('medication_doses')
      .select(`
        id,
        scheduled_at,
        user_id,
        prescription_medicine_id,
        prescription_medicines(
          medicine_name,
          dosage,
          instructions
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', nowISO)
      .lte('scheduled_at', oneHourISO);

    if (error) {
      console.error('Error al verificar dosis de medicamentos:', error);
      return;
    }

    console.log(`[checkMedicationDoses] Encontradas ${upcomingDoses?.length || 0} dosis próximas`);

    console.log(`[checkMedicationDoses] Encontradas ${upcomingDoses?.length || 0} dosis próximas`);

    for (const dose of upcomingDoses || []) {
      console.log('[checkMedicationDoses] Procesando dosis:', {
        id: dose.id,
        scheduled_at: dose.scheduled_at,
        medicine: (dose.prescription_medicines as any)?.medicine_name
      });

      // Generar alerta en la app
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

      // Verificar si el usuario tiene WhatsApp habilitado
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, phone_number, whatsapp_notifications_enabled')
        .eq('id', dose.user_id)
        .single();

      if (profile?.whatsapp_notifications_enabled && profile?.phone_number) {
        const scheduledTime = new Date(dose.scheduled_at);
        const timeString = scheduledTime.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        // Enviar recordatorio por WhatsApp
        const result = await sendMedicationReminder(profile.phone_number, {
          patientName: profile.first_name || 'Paciente',
          medicineName: (dose.prescription_medicines as any)?.medicine_name || 'Medicamento',
          dosage: (dose.prescription_medicines as any)?.dosage || '',
          scheduledTime: timeString,
          instructions: (dose.prescription_medicines as any)?.instructions,
        });

        if (result.success) {
          console.log(`✅ [WhatsApp] Recordatorio enviado a ${profile.phone_number}`);
        } else {
          console.error(`❌ [WhatsApp] Error enviando a ${profile.phone_number}:`, result.error);
        }
      }
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
