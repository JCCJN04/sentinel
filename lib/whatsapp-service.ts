/**
 * Servicio de WhatsApp con Twilio
 * 
 * Envía recordatorios de medicamentos por WhatsApp
 */

import twilio from 'twilio';

// Inicializar cliente de Twilio
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Credenciales de Twilio no configuradas. Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en .env.local');
  }

  return twilio(accountSid, authToken);
}

interface MedicationReminder {
  patientName: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // Formato: "14:30"
  instructions?: string;
  isImmediate?: boolean; // true = es hora de tomar, false/undefined = recordatorio 1h antes
}

/**
 * Envía un recordatorio de medicamento por WhatsApp
 */
export async function sendMedicationReminder(
  toPhoneNumber: string,
  reminder: MedicationReminder
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!fromNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER no configurado en .env.local');
    }

    // Formatear número de destino (debe incluir código de país)
    const formattedTo = toPhoneNumber.startsWith('whatsapp:') 
      ? toPhoneNumber 
      : `whatsapp:${toPhoneNumber}`;

    const formattedFrom = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;

    // Construir mensaje
    const message = buildReminderMessage(reminder);

    console.log(`📱 [WhatsApp] Enviando recordatorio a ${formattedTo}`);

    // Enviar mensaje
    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
    });

    console.log(`✅ [WhatsApp] Mensaje enviado exitosamente. SID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };

  } catch (error) {
    console.error('❌ [WhatsApp] Error enviando mensaje:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Construye el texto del mensaje de recordatorio
 */
function buildReminderMessage(reminder: MedicationReminder): string {
  const { patientName, medicineName, dosage, scheduledTime, instructions, isImmediate } = reminder;
  const isNow = isImmediate === true;

  let message = isNow 
    ? `⏰ *¡Es hora de tu medicamento!*\n\n`
    : `🏥 *Recordatorio de Medicamento*\n\n`;
  
  message += `Hola ${patientName},\n\n`;
  
  if (isNow) {
    message += `💊 Toma ahora: *${medicineName}* - ${dosage}\n`;
    message += `⏰ Hora programada: ${scheduledTime}\n`;
  } else {
    message += `En 1 hora debes tomar:\n`;
    message += `💊 *${medicineName}* - ${dosage}\n`;
    message += `⏰ Programado: ${scheduledTime}\n`;
  }

  if (instructions) {
    message += `\n📋 Instrucciones: ${instructions}\n`;
  }

  if (isNow) {
    message += `\n✅ Por favor, registra tu toma en la app después de tomarla.\n\n`;
  } else {
    message += `\n⏰ Recibirás otro recordatorio cuando sea el momento exacto.\n\n`;
  }
  
  message += `🩺 Cuida tu salud con Zyra`;

  return message;
}

/**
 * Envía un mensaje de prueba para verificar la configuración
 */
export async function sendTestMessage(
  toPhoneNumber: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!fromNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER no configurado');
    }

    const formattedTo = toPhoneNumber.startsWith('whatsapp:') 
      ? toPhoneNumber 
      : `whatsapp:${toPhoneNumber}`;

    const formattedFrom = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;

    const message = `🏥 *Zyra - Prueba de Conexión*\n\n` +
                   `✅ Tu número ha sido verificado correctamente.\n\n` +
                   `A partir de ahora recibirás recordatorios de tus medicamentos por WhatsApp.\n\n` +
                   `🩺 Cuida tu salud con Zyra`;

    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
    });

    console.log(`✅ [WhatsApp] Mensaje de prueba enviado. SID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };

  } catch (error) {
    console.error('❌ [WhatsApp] Error en mensaje de prueba:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
