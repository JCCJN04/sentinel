/**
 * API Route: WhatsApp Configuration & Testing
 * 
 * Endpoint para configurar y probar mensajes de WhatsApp
 * POST /api/whatsapp/test - Envía mensaje de prueba
 * POST /api/whatsapp/configure - Guarda número y habilita notificaciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTestMessage } from '@/lib/whatsapp-service';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';

// Database query timeout helper
const DB_TIMEOUT_MS = 10000;
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DB_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    ),
  ]);
}

// Validation schemas
const whatsappTestSchema = z.object({
  action: z.literal('test'),
  phoneNumber: z.string()
    .regex(/^\+\d{10,15}$/, 'El número debe incluir código de país (ej: +525512345678)')
});

const whatsappConfigureSchema = z.object({
  action: z.literal('configure'),
  phoneNumber: z.string()
    .regex(/^\+\d{10,15}$/, 'El número debe incluir código de país (ej: +525512345678)'),
  enableNotifications: z.boolean().optional()
});

const whatsappRequestSchema = z.discriminatedUnion('action', [
  whatsappTestSchema,
  whatsappConfigureSchema
]);

// Crear cliente de Supabase con service role
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Función para obtener usuario autenticado
async function getAuthenticatedUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  return { user, error };
}

/**
 * POST /api/whatsapp/test
 * Envía un mensaje de prueba al número configurado
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      secureLog('warn', 'Unauthenticated WhatsApp test attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request
    const validationResult = whatsappRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      secureLog('warn', 'Invalid WhatsApp request data', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Acción: Enviar mensaje de prueba
    if (validatedData.action === 'test') {
      secureLog('info', 'Sending WhatsApp test message', {
        userId: user.id,
        phoneNumber: validatedData.phoneNumber.substring(0, 6) + '***' // Partial for privacy
      });

      // Obtener nombre del usuario desde el perfil
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const userName = profile?.first_name || profile?.last_name || 'Usuario';

      const result = await sendTestMessage(validatedData.phoneNumber, userName);

      if (result.success) {
        secureLog('info', 'WhatsApp test message sent successfully', {
          userId: user.id,
          messageId: result.messageId
        });
        
        return NextResponse.json({
          success: true,
          message: 'Mensaje de prueba enviado exitosamente',
          messageId: result.messageId,
        });
      } else {
        secureLog('error', 'Failed to send WhatsApp test message', {
          userId: user.id,
          error: result.error
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error enviando mensaje. Verifica tu configuración de Twilio.' 
          },
          { status: 500 }
        );
      }
    }

    // Acción: Configurar número y preferencias
    if (validatedData.action === 'configure') {
      const supabase = createServiceClient();

      secureLog('info', 'Updating WhatsApp configuration', {
        userId: user.id,
        phoneNumber: validatedData.phoneNumber.substring(0, 6) + '***',
        notificationsEnabled: validatedData.enableNotifications ?? true
      });

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_number: validatedData.phoneNumber,
          whatsapp_notifications_enabled: validatedData.enableNotifications ?? true,
        })
        .eq('id', user.id)
        .select('phone_number, whatsapp_notifications_enabled')
        .single();

      if (updateError) {
        secureLog('error', 'Failed to update WhatsApp configuration', {
          userId: user.id,
          errorMessage: updateError.message,
          errorCode: updateError.code
        });
        
        return NextResponse.json(
          { error: 'Error guardando configuración: ' + updateError.message },
          { status: 500 }
        );
      }

      secureLog('info', 'WhatsApp configuration updated successfully', {
        userId: user.id,
        phoneNumberSaved: updatedProfile?.phone_number?.substring(0, 6) + '***',
        notificationsEnabled: updatedProfile?.whatsapp_notifications_enabled
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración guardada exitosamente',
      });
    }

    // This should never happen due to discriminated union validation
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    secureLog('error', 'Unexpected error in WhatsApp API', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
