/**
 * API Route: Medical Chat Assistant
 * 
 * Endpoint para el chatbot de asistente médico IA
 * POST /api/ai/medical-chat
 * 
 * Funcionalidad:
 * 1. Valida autenticación del usuario
 * 2. Obtiene el contexto médico completo del paciente desde Supabase
 * 3. Genera respuesta inteligente usando Gemini AI
 * 4. Retorna la respuesta al frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getMedicalContext,
  generateMedicalResponse,
  validateUserMessage,
} from '@/lib/medical-assistant-service';
import type { ChatRequest, ChatResponse, MedicalAssistantError } from '@/types/medical-assistant';

// Crear cliente de Supabase para el servidor
function createSupabaseServerClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Obtener el token de autenticación del header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏥 [Medical Chat API] Nueva petición recibida');
    
    // 1. Crear cliente de Supabase y verificar autenticación
    const supabase = createSupabaseServerClient(request);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [Medical Chat API] Error de autenticación:', authError);
      return NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión.' } as MedicalAssistantError,
        { status: 401 }
      );
    }

    console.log(`✅ [Medical Chat API] Usuario autenticado: ${user.id}`);

    // 2. Parsear el body de la petición
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [] } = body;

    console.log(`📝 [Medical Chat API] Mensaje del usuario: "${message.substring(0, 50)}..."`);

    // 3. Validar el mensaje del usuario
    const validation = validateUserMessage(message);
    if (!validation.valid) {
      console.error('❌ [Medical Chat API] Validación fallida:', validation.error);
      return NextResponse.json(
        { error: validation.error } as MedicalAssistantError,
        { status: 400 }
      );
    }

    // 4. Obtener el contexto médico completo del paciente
    console.log('🔍 [Medical Chat API] Consultando contexto médico...');
    const medicalContext = await getMedicalContext(user.id, supabase);
    console.log('✅ [Medical Chat API] Contexto médico obtenido');

    // 5. Generar respuesta usando Gemini AI
    console.log('🤖 [Medical Chat API] Llamando a Gemini AI...');
    const assistantMessage = await generateMedicalResponse(
      message,
      medicalContext,
      conversationHistory
    );

    console.log('✅ [Medical Chat API] Respuesta generada exitosamente');

    // 6. Retornar respuesta exitosa
    const response: ChatResponse = {
      message: assistantMessage,
      timestamp: new Date(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ [Medical Chat API] Error en el endpoint:', error);
    
    // Manejar diferentes tipos de errores
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo.';

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      } as MedicalAssistantError,
      { status: 500 }
    );
  }
}

// Manejar métodos HTTP no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' } as MedicalAssistantError,
    { status: 405 }
  );
}
