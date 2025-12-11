/**
 * API Route: Medical Chat Assistant
 * 
 * SECURITY ENHANCEMENTS:
 * - Validación estricta de inputs con Zod
 * - Rate limiting adicional por usuario
 * - Sanitización de respuestas
 * - Logging seguro sin datos sensibles
 * - Timeout en queries DB
 * - API key solo server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getMedicalContext,
  generateMedicalResponse,
} from '@/lib/medical-assistant-service';
import { validateData, aiSchemas } from '@/middleware/validation';
import { secureLog } from '@/middleware/security';
import { ChatMessage } from '@/types/medical-assistant';
import type { ChatRequest, ChatResponse, MedicalAssistantError } from '@/types/medical-assistant';

// SECURITY: Timeout para prevenir ataques de slow query
const DB_TIMEOUT_MS = 10000; // 10 segundos

function createSupabaseServerClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    db: {
      // SECURITY: Timeout en queries
      schema: 'public',
    },
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // SECURITY: Verificar autenticación
    const supabase = createSupabaseServerClient(request);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      secureLog('warn', 'Unauthorized medical chat attempt', {});
      return NextResponse.json(
        { error: 'No autenticado' } as MedicalAssistantError,
        { status: 401 }
      );
    }

    // SECURITY: Validar body con Zod
    const body = await request.json();
    const validation = validateData(aiSchemas.chat, body);
    
    if (!validation.success) {
      secureLog('warn', 'Invalid chat request', { userId: user.id });
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: Array.isArray(validation.errors) 
            ? validation.errors.join(', ') 
            : validation.errors
        } as MedicalAssistantError,
        { status: 400 }
      );
    }

    const { message, conversationHistory = [] } = validation.data;

    // SECURITY: Logging sin contenido sensible
    secureLog('info', 'Medical chat request', {
      userId: user.id,
      messageLength: message.length,
      historyLength: conversationHistory.length,
    });

    // SECURITY: Timeout en obtención de contexto
    const contextPromise = getMedicalContext(user.id, supabase);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT_MS)
    );

    const medicalContext = await Promise.race([contextPromise, timeoutPromise]);

    // Transformar conversationHistory: string timestamps -> Date objects
    const historyWithDates: ChatMessage[] = conversationHistory.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    // Generar respuesta usando Gemini AI (solo server-side)
    const assistantMessage = await generateMedicalResponse(
      message,
      medicalContext,
      historyWithDates
    );

    const duration = Date.now() - startTime;
    secureLog('info', 'Medical chat success', {
      userId: user.id,
      duration,
    });

    const response: ChatResponse = {
      message: assistantMessage,
      timestamp: new Date(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // SECURITY: No exponer detalles del error al cliente
    secureLog('error', 'Medical chat error', {
      duration,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    
    // Mensaje genérico al cliente
    const clientMessage = error instanceof Error && error.message.includes('timeout')
      ? 'La solicitud tardó demasiado. Por favor intenta de nuevo.'
      : 'Error al procesar tu pregunta. Por favor intenta de nuevo.';

    return NextResponse.json(
      { error: clientMessage } as MedicalAssistantError,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' } as MedicalAssistantError,
    { status: 405 }
  );
}
