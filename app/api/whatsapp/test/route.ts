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
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, phoneNumber, enableNotifications } = body;

    // Acción: Enviar mensaje de prueba
    if (action === 'test') {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Número de teléfono requerido' },
          { status: 400 }
        );
      }

      console.log(`📱 [WhatsApp API] Enviando mensaje de prueba a ${phoneNumber}`);

      const result = await sendTestMessage(phoneNumber);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Mensaje de prueba enviado exitosamente',
          messageId: result.messageId,
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'Error enviando mensaje' 
          },
          { status: 500 }
        );
      }
    }

    // Acción: Configurar número y preferencias
    if (action === 'configure') {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Número de teléfono requerido' },
          { status: 400 }
        );
      }

      const supabase = createServiceClient();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_number: phoneNumber,
          whatsapp_notifications_enabled: enableNotifications ?? true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error actualizando perfil:', updateError);
        return NextResponse.json(
          { error: 'Error guardando configuración' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Configuración guardada exitosamente',
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Usa "test" o "configure"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [WhatsApp API] Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
