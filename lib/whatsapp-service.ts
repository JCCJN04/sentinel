/**
 * Servicio de WhatsApp con Twilio
 * 
 * Envía SOLO:
 * 1. Mensaje de bienvenida al verificar número
 * 2. Recordatorios de medicamentos
 */

import twilio from 'twilio';
import { secureLog } from '@/middleware/security';

// SIDs de las Content Templates aprobadas en Twilio (verificadas Dec 9, 2025)
const TEMPLATES = {
  MEDICATION_REMINDER: 'HX7a90a5d7840f9e6139f1efbd526700d3', // medication_reminder
  WELCOME_VERIFICATION: 'HXed4dad300cdd95154003a6998b0d4d1f', // welcome_verification
} as const;

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
 * Envía un recordatorio de medicamento por WhatsApp usando Content Template
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

    secureLog('info', 'Sending WhatsApp medication reminder', {
      to: formattedTo.substring(0, 15) + '***', // Partial number for privacy
      medicine: reminder.medicineName,
      time: reminder.scheduledTime
    });

    // Usar Content Template aprobada
    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      contentSid: TEMPLATES.MEDICATION_REMINDER,
      contentVariables: JSON.stringify({
        '1': reminder.patientName,
        '2': reminder.medicineName,
        '3': reminder.dosage,
        '4': reminder.scheduledTime,
      }),
    });

    secureLog('info', 'WhatsApp medication reminder sent successfully', {
      messageSid: result.sid,
      status: result.status
    });

    return {
      success: true,
      messageId: result.sid,
    };

  } catch (error) {
    secureLog('error', 'Failed to send WhatsApp medication reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      medicine: reminder.medicineName
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Envía un mensaje de bienvenida/verificación usando Content Template
 */
export async function sendWelcomeMessage(
  toPhoneNumber: string,
  userName: string
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

    secureLog('info', 'Sending WhatsApp welcome message', {
      to: formattedTo.substring(0, 15) + '***'
    });

    const result = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      contentSid: TEMPLATES.WELCOME_VERIFICATION,
      contentVariables: JSON.stringify({
        '1': userName,
      }),
    });

    secureLog('info', 'WhatsApp welcome message sent successfully', {
      messageSid: result.sid
    });

    return {
      success: true,
      messageId: result.sid,
    };

  } catch (error) {
    secureLog('error', 'Failed to send WhatsApp welcome message', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
