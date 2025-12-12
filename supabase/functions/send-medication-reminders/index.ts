// ============================================================================
// Edge Function: send-medication-reminders
// 
// Procesa notificaciones pendientes y envía recordatorios por WhatsApp via Twilio
// 
// Desplegar con:
//   supabase functions deploy send-medication-reminders
//
// Configurar secrets:
//   supabase secrets set TWILIO_ACCOUNT_SID=xxx
//   supabase secrets set TWILIO_AUTH_TOKEN=xxx
//   supabase secrets set TWILIO_WHATSAPP_NUMBER=+19786969677
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Tipos
interface WhatsAppNotification {
  id: string
  user_id: string
  medication_dose_id: string | null
  prescription_medicine_id: string | null
  phone_number: string
  patient_name: string
  medicine_name: string
  dosage: string | null
  scheduled_time: string
  notification_type: 'reminder_5min' | 'reminder_exact'
  scheduled_at: string
  status: string
  retry_count: number
  max_retries: number
}

interface TwilioResponse {
  sid?: string
  status?: string
  error_code?: string
  error_message?: string
}

// Content Template SIDs (ya aprobados en Twilio)
const TEMPLATES = {
  MEDICATION_REMINDER: 'HX7a90a5d7840f9e6139f1efbd526700d3',
} as const

// Configuración
const BATCH_SIZE = 10 // Procesar máximo 10 notificaciones por invocación
const LOCK_TIMEOUT_SECONDS = 60 // Tiempo máximo que una notificación puede estar "processing"

/**
 * Envía un mensaje de WhatsApp via Twilio usando Content Templates
 */
async function sendWhatsAppMessage(
  notification: WhatsAppNotification
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Credenciales de Twilio no configuradas',
    }
  }

  try {
    // Formatear números
    const formattedTo = notification.phone_number.startsWith('whatsapp:')
      ? notification.phone_number
      : `whatsapp:${notification.phone_number}`

    const formattedFrom = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`

    // Llamar a Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const body = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      ContentSid: TEMPLATES.MEDICATION_REMINDER,
      ContentVariables: JSON.stringify({
        '1': notification.patient_name,
        '2': notification.medicine_name,
        '3': notification.dosage || 'según indicación',
        '4': notification.scheduled_time,
      }),
    })

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const result: TwilioResponse = await response.json()

    if (response.ok && result.sid) {
      console.log(`✅ Mensaje enviado: ${result.sid} a ${formattedTo.substring(0, 15)}***`)
      return {
        success: true,
        messageId: result.sid,
      }
    } else {
      console.error(`❌ Error Twilio: ${result.error_code} - ${result.error_message}`)
      return {
        success: false,
        error: `${result.error_code}: ${result.error_message}`,
      }
    }
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Handler principal de la Edge Function
 */
serve(async (req: Request) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verificar autorización
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Crear cliente de Supabase con service_role (bypassa RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('🔔 Iniciando procesamiento de notificaciones...')

    // 1. Liberar notificaciones que quedaron "processing" por más de 60 segundos
    const { error: unlockError } = await supabase
      .from('whatsapp_notifications')
      .update({ status: 'pending' })
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - LOCK_TIMEOUT_SECONDS * 1000).toISOString())

    if (unlockError) {
      console.warn('⚠️ Error liberando notificaciones bloqueadas:', unlockError)
    }

    // 2. Obtener notificaciones pendientes que ya deben enviarse
    const now = new Date().toISOString()
    
    const { data: notifications, error: fetchError } = await supabase
      .from('whatsapp_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .lt('retry_count', 3) // Solo las que no han excedido reintentos
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error('❌ Error obteniendo notificaciones:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!notifications || notifications.length === 0) {
      console.log('📭 No hay notificaciones pendientes')
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0,
        message: 'No pending notifications' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`📨 Procesando ${notifications.length} notificaciones...`)

    // 3. Procesar cada notificación
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const notification of notifications as WhatsAppNotification[]) {
      // 3.1 Marcar como "processing" (lock)
      const { error: lockError } = await supabase
        .from('whatsapp_notifications')
        .update({ 
          status: 'processing', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notification.id)
        .eq('status', 'pending') // Double-check para evitar race conditions

      if (lockError) {
        console.warn(`⚠️ No se pudo bloquear notificación ${notification.id}:`, lockError)
        continue
      }

      // 3.2 Enviar mensaje
      const sendResult = await sendWhatsAppMessage(notification)

      // 3.3 Actualizar estado según resultado
      if (sendResult.success) {
        // Éxito: marcar como enviado
        await supabase
          .from('whatsapp_notifications')
          .update({
            status: 'sent',
            twilio_message_sid: sendResult.messageId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id)

        // Registrar en logs
        await supabase
          .from('whatsapp_notification_logs')
          .insert({
            notification_id: notification.id,
            user_id: notification.user_id,
            phone_number: notification.phone_number,
            message_type: 'medication_reminder',
            twilio_message_sid: sendResult.messageId,
            twilio_status: 'sent',
            success: true,
          })

        results.sent++
        
      } else {
        // Error: incrementar retry o marcar como fallido
        const newRetryCount = notification.retry_count + 1
        const newStatus = newRetryCount >= notification.max_retries ? 'failed' : 'pending'

        await supabase
          .from('whatsapp_notifications')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            last_error: sendResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id)

        // Registrar en logs
        await supabase
          .from('whatsapp_notification_logs')
          .insert({
            notification_id: notification.id,
            user_id: notification.user_id,
            phone_number: notification.phone_number,
            message_type: 'medication_reminder',
            twilio_error_message: sendResult.error,
            success: false,
          })

        results.failed++
        results.errors.push(`${notification.id}: ${sendResult.error}`)
      }

      // Pequeña pausa entre mensajes para no saturar Twilio
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Procesamiento completado: ${results.sent} enviados, ${results.failed} fallidos`)

    return new Response(JSON.stringify({
      success: true,
      processed: notifications.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error en Edge Function:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
