/**
 * API Route: Analyze Recipe with Gemini AI
 * 
 * SECURITY: Gemini API key is server-side only
 * This endpoint receives base64 images and returns extracted recipe data
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';
import { createClient } from '@supabase/supabase-js';

// Validation schema
const analyzeRecipeSchema = z.object({
  base64Image: z.string().min(100),
  imageType: z.string().optional().default('image/jpeg'),
});

// Get authenticated user
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

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      secureLog('warn', 'Unauthorized recipe analysis attempt', {});
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = analyzeRecipeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { base64Image, imageType } = validation.data;

    // SECURITY: Gemini API key is only accessed server-side
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      secureLog('error', 'Gemini API key not configured', {});
      return NextResponse.json(
        { error: 'Servicio de AI no configurado' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Clean base64 string
    const cleanBase64 = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `Analiza esta receta médica y extrae la siguiente información en formato JSON:

{
  "diagnosis": "diagnóstico del paciente",
  "doctor_name": "nombre del doctor",
  "medicines": [
    {
      "name": "nombre del medicamento",
      "dosage": "dosis (ej: 500mg, 1 tableta)",
      "frequency_hours": número_de_horas_entre_dosis,
      "duration_days": número_total_de_días,
      "instructions": "instrucciones especiales"
    }
  ],
  "prescription_date": "fecha de la receta (YYYY-MM-DD)",
  "end_date": "fecha de finalización (YYYY-MM-DD) o null",
  "additional_notes": "notas adicionales",
  "confidence": número_entre_0_y_1
}

Reglas:
- Si no encuentras algún dato, usa null
- frequency_hours: convierte "cada 8 horas" a 8, "cada 12 horas" a 12, etc.
- duration_days: extrae el número total de días de tratamiento
- confidence: qué tan seguro estás de la extracción (0.0-1.0)
- Retorna SOLO el JSON, sin texto adicional`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: imageType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      secureLog('error', 'Failed to extract JSON from Gemini response', { userId: user.id });
      return NextResponse.json(
        { error: 'No se pudo analizar la respuesta de AI' },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    secureLog('info', 'Recipe analyzed successfully', {
      userId: user.id,
      confidence: extractedData.confidence,
      medicineCount: extractedData.medicines?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    secureLog('error', 'Recipe analysis error', {
      error: error.message,
    });

    return NextResponse.json(
      { error: 'Error al analizar la receta', details: error.message },
      { status: 500 }
    );
  }
}