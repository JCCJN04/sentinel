import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';
import crypto from 'crypto';

// Validation schema for Twilio webhook data
const twilioMessageSchema = z.object({
  From: z.string().regex(/^whatsapp:\+\d{10,15}$/, 'Formato de número inválido'),
  To: z.string().regex(/^whatsapp:\+\d{10,15}$/, 'Formato de número inválido'),
  Body: z.string().max(1600).optional(), // WhatsApp message limit
  MessageSid: z.string().regex(/^[A-Z0-9]{34}$/, 'MessageSid inválido'),
  AccountSid: z.string().regex(/^AC[a-f0-9]{32}$/, 'AccountSid inválido'),
  NumMedia: z.string().regex(/^\d+$/).optional(),
  ProfileName: z.string().max(100).optional()
});

/**
 * Validates Twilio request signature to prevent spoofing
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, any>
): boolean {
  if (!signature) return false;
  
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  // Sort parameters alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');

  const data = url + sortedParams;
  
  // Create HMAC SHA1 signature
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Webhook para recibir mensajes entrantes de WhatsApp vía Twilio
 * Este endpoint se debe configurar en Twilio Console
 */
export async function POST(request: NextRequest) {
  try {
    // Get Twilio signature from headers
    const twilioSignature = request.headers.get('x-twilio-signature');
    const url = request.url;

    const formData = await request.formData();
    
    // Convert FormData to object for validation
    const formDataObject: Record<string, string> = {};
    formData.forEach((value, key) => {
      formDataObject[key] = value.toString();
    });

    // Validate Twilio signature (prevent webhook spoofing)
    if (!validateTwilioSignature(twilioSignature, url, formDataObject)) {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      secureLog('warn', 'Invalid Twilio signature on WhatsApp webhook', {
        ip,
        hasSignature: !!twilioSignature
      });
      
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validate message data
    const validationResult = twilioMessageSchema.safeParse(formDataObject);
    
    if (!validationResult.success) {
      secureLog('warn', 'Invalid WhatsApp message data', {
        errors: validationResult.error.errors
      });
      
      // Still return 200 to prevent Twilio retries
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    const messageData = validationResult.data;

    secureLog('info', 'WhatsApp message received', {
      from: messageData.From.substring(0, 15), // Partial number for privacy
      messageSid: messageData.MessageSid,
      hasBody: !!messageData.Body,
      numMedia: messageData.NumMedia || '0'
    });

    // Aquí puedes procesar el mensaje
    // Por ejemplo: responder automáticamente, guardar en DB, etc.

    // Responder con TwiML vacío (200 OK)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  } catch (error) {
    secureLog('error', 'Error processing WhatsApp message', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return 200 even on error to prevent Twilio retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
}

// Permitir GET para verificación de Twilio
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook de WhatsApp activo' 
  });
}
