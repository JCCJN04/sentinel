// lib/gemini-recipe-service.ts
/**
 * DEPRECATED - This file is no longer used for client-side operations.
 * Use /api/ai/analyze-recipe endpoint instead for secure server-side processing.
 * 
 * This file is kept for backwards compatibility with existing scripts only.
 * All functions will throw errors if called from client-side code.
 */

const SECURITY_ERROR = 'This service can only be used server-side. Use /api/ai/analyze-recipe instead.';

/**
 * Check if code is running on server (Node.js environment)
 */
function assertServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error(SECURITY_ERROR);
  }
}

/**
 * @deprecated Use /api/ai/analyze-recipe endpoint instead
 */
export const extractRecipeDataFromImage = async (
  base64Image: string,
  imageType: string = 'image/jpeg'
): Promise<{
  diagnosis: string;
  doctor_name: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency_hours: number | null;
    duration_days: number | null;
    instructions: string;
  }>;
  prescription_date: string;
  end_date: string | null;
  additional_notes: string;
  confidence: number;
}> => {
  assertServerSide();
  
  // This function should only be called from server-side scripts
  // For client-side usage, call /api/ai/analyze-recipe instead
  throw new Error('Use /api/ai/analyze-recipe endpoint for client-side recipe analysis');
  
  /* LEGACY CODE - DO NOT USE
  try {
    // Eliminar prefijo de data URL si existe
    const cleanBase64 = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    // Inicializar modelo Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });

    // Prompt específico para recetas médicas
    const prompt = `
    Analiza esta imagen de una receta médica/prescripción y extrae la siguiente información:
    
    1. **Diagnóstico**: ¿Cuál es el diagnóstico o motivo de la consulta?
    2. **Nombre del doctor**: ¿Quién es el profesional que firma la receta?
   3. **Medicamentos**: Extrae cada medicamento con:
       - Nombre del medicamento
       - Dosis (ej: 500mg, 2 comprimidos)
       - Frecuencia en HORAS (ej: 8 para cada 8 horas, 12 para cada 12 horas, 6 para 4 veces al día)
     - Duración en DÍAS (ej: 7 para una semana, 10 para 10 días)
     - Instrucciones específicas o recomendaciones del médico
  4. **Fecha de prescripción**: ¿Cuándo fue emitida la receta? (fecha de inicio del tratamiento)
  5. **Fecha de fin**: ¿Cuándo termina o expira la receta? Busca cualquier indicación de validez, vencimiento o fecha límite de uso
  6. **Notas generales**: Indicaciones adicionales, recomendaciones o advertencias generales escritas por el médico
    
    Responde en JSON con la siguiente estructura EXACTA:
    {
      "diagnosis": "texto del diagnóstico",
      "doctor_name": "nombre del doctor",
      "medicines": [
        {
          "name": "nombre medicamento",
          "dosage": "dosis",
          "frequency_hours": 8,
          "duration_days": 7,
          "instructions": "tomar con alimentos"
        }
      ],
      "prescription_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
  "additional_notes": "notas generales relevantes",
      "confidence": 0.95
    }
    
    IMPORTANTE:
    - Si no encuentras la frecuencia en horas, deja frequency_hours como null
    - Si no encuentras la duración en días, deja duration_days como null
    - Si no encuentras la fecha de fin/vencimiento, deja end_date como null
    - Si no encuentras algún campo, usa valores vacíos/null:
      - diagnosis: "No especificado"
      - doctor_name: "Doctor no identificado"
      - medicines: []
      - prescription_date: fecha actual
      - end_date: null
  - additional_notes: ""
      - instructions: "No especificado"
    `;

    // Llamar a Gemini con la imagen
    const response = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: imageType,
        },
      },
      prompt,
    ]);

    // Extraer texto de respuesta
    const responseText = response.response.text();

    // Parsear JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // Procesar medicamentos para asegurar que tengan los campos correctos
    const collectText = (value: unknown): string[] => {
      if (value === null || value === undefined) return [];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return [String(value)];
      }
      if (Array.isArray(value)) {
        return value.flatMap((item) => collectText(item));
      }
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).flatMap((item) => collectText(item));
      }
      return [];
    };

    const processText = (value: unknown): string => collectText(value).join('. ');

    const processedMedicines = (extractedData.medicines || []).map((med: any) => {
      const instructionsText = processText(med.instructions);
      const frequencyValue = med.frequency_hours ?? med.frequencyHours ?? med.frequency ?? null;
      const durationValue = med.duration_days ?? med.durationDays ?? med.duration ?? null;

      return {
        name: processText(med.name || med.medicine_name) || '',
        dosage: processText(med.dosage) || '',
        frequency_hours:
          frequencyValue !== undefined && frequencyValue !== null && frequencyValue !== ''
            ? Number(frequencyValue)
            : null,
        duration_days:
          durationValue !== undefined && durationValue !== null && durationValue !== ''
            ? Number(durationValue)
            : null,
        instructions: instructionsText || 'No especificado',
      };
    });

    return {
      diagnosis: processText(extractedData.diagnosis) || 'No especificado',
      doctor_name: processText(extractedData.doctor_name) || 'Doctor no identificado',
      medicines: processedMedicines,
      prescription_date: processText(extractedData.prescription_date) || new Date().toISOString().split('T')[0],
      end_date: extractedData.end_date ? processText(extractedData.end_date) : null,
      additional_notes: processText(extractedData.additional_notes),
      confidence: extractedData.confidence || 0.8,
    };
  } catch (error) {
    console.error('Error extrayendo datos de receta con Gemini:', error);
    throw new Error(
      `Error analizando receta: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
  */
};

/**
 * @deprecated Use /api/ai/analyze-recipe endpoint instead
 */
export const validatePrescriptionImage = async (
  base64Image: string,
  imageType: string = 'image/jpeg'
): Promise<{
  isPrescription: boolean;
  isLegible: boolean;
  quality: 'high' | 'medium' | 'low';
  message: string;
}> => {
  assertServerSide();
  throw new Error('Use /api/ai/analyze-recipe endpoint instead');
  
  /* LEGACY CODE - DO NOT USE
  try {
    const cleanBase64 = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });

    const response = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: imageType,
        },
      },
      `
      Valida esta imagen y responde en JSON:
      {
        "isPrescription": true/false,
        "isLegible": true/false,
        "quality": "high|medium|low",
        "message": "descripción breve"
      }
      `,
    ]);

    const responseText = response.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        isPrescription: false,
        isLegible: false,
        quality: 'low',
        message: 'No se pudo validar la imagen',
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error validando imagen:', error);
    return {
      isPrescription: false,
      isLegible: false,
      quality: 'low',
      message: 'Error al validar imagen',
    };
  }
  */
};
