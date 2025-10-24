// lib/gemini-recipe-service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDUlt_xyF8CsMFuB5_4YrWh7Ix_gG3tUlw');

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
  }>;
  prescription_date: string;
  additional_notes: string;
  confidence: number;
}> => {
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
    4. **Fecha de prescripción**: ¿Cuándo fue emitida la receta?
    5. **Notas adicionales**: Instrucciones especiales, advertencias, contraindicaciones
    
    Responde en JSON con la siguiente estructura EXACTA:
    {
      "diagnosis": "texto del diagnóstico",
      "doctor_name": "nombre del doctor",
      "medicines": [
        {
          "name": "nombre medicamento",
          "dosage": "dosis",
          "frequency_hours": 8,
          "duration_days": 7
        }
      ],
      "prescription_date": "YYYY-MM-DD",
      "additional_notes": "notas relevantes",
      "confidence": 0.95
    }
    
    IMPORTANTE:
    - Si no encuentras la frecuencia en horas, deja frequency_hours como null
    - Si no encuentras la duración en días, deja duration_days como null
    - Si no encuentras algún campo, usa valores vacíos/null:
      - diagnosis: "No especificado"
      - doctor_name: "Doctor no identificado"
      - medicines: []
      - prescription_date: fecha actual
      - additional_notes: "Información incompleta en la receta"
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
    const processedMedicines = (extractedData.medicines || []).map((med: any) => ({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency_hours: med.frequency_hours !== undefined && med.frequency_hours !== null ? med.frequency_hours : null,
      duration_days: med.duration_days !== undefined && med.duration_days !== null ? med.duration_days : null,
    }));

    return {
      diagnosis: extractedData.diagnosis || 'No especificado',
      doctor_name: extractedData.doctor_name || 'Doctor no identificado',
      medicines: processedMedicines,
      prescription_date: extractedData.prescription_date || new Date().toISOString().split('T')[0],
      additional_notes: extractedData.additional_notes || '',
      confidence: extractedData.confidence || 0.8,
    };
  } catch (error) {
    console.error('Error extrayendo datos de receta con Gemini:', error);
    throw new Error(
      `Error analizando receta: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

export const validatePrescriptionImage = async (
  base64Image: string,
  imageType: string = 'image/jpeg'
): Promise<{
  isPrescription: boolean;
  isLegible: boolean;
  quality: 'high' | 'medium' | 'low';
  message: string;
}> => {
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
};
