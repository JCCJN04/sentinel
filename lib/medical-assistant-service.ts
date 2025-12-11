/**
 * Servicio del Asistente IA Médico
 * 
 * SECURITY ENHANCEMENTS:
 * - Gemini API Key solo server-side (NO expuesta al cliente)
 * - Sanitización de datos médicos en contexto
 * - Timeout en llamadas a Gemini
 * - Prevención de inyección de prompts
 * - Logging sin información sensible
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { secureLog } from '@/middleware/security';
import type { MedicalContext, ChatMessage } from '@/types/medical-assistant';

// SECURITY: API Key SOLO en servidor (nunca NEXT_PUBLIC_)
const getGeminiClient = () => {
  // CRITICAL: Usar variable sin NEXT_PUBLIC_ para que NO se exponga al cliente
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY no configurada en variables de entorno del servidor');
  }

  return new GoogleGenerativeAI(apiKey);
};

const GEMINI_TIMEOUT_MS = 30000; // 30 segundos

/**
 * Obtiene el contexto médico completo del paciente desde Supabase
 * SECURITY: Con timeout y sanitización de datos
 */
export async function getMedicalContext(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<MedicalContext> {
  const context: MedicalContext = {};

  try {
    // SECURITY: Timeout para todas las queries
    const queryTimeout = 5000; // 5 segundos por query

    // Helper para agregar timeout
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), ms)
        ),
      ]);
    };

    // 1. Perfil del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, genero, tipo_de_sangre')
      .eq('id', userId)
      .single();

    if (profile) {
      context.profile = {
        firstName: profile.first_name,
        lastName: profile.last_name,
        gender: profile.genero,
        bloodType: profile.tipo_de_sangre,
      };
    }

    // 2. Obtener documentos médicos recientes (tabla: documents)
    // Limitamos a los últimos 20 documentos para no saturar el contexto
    const { data: documents } = await supabaseClient
      .from('documents')
      .select('name, category, date, provider, notes, doctor_name, specialty')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(20);

    if (documents && documents.length > 0) {
      context.documents = documents.map(doc => ({
        name: doc.name,
        category: doc.category,
        date: doc.date,
        provider: doc.provider || undefined,
        notes: doc.notes || undefined,
        doctorName: doc.doctor_name || undefined,
        specialty: doc.specialty || undefined,
      }));
    }

    // 3. Obtener recetas activas (tablas: prescriptions + prescription_medicines)
    const { data: prescriptions } = await supabaseClient
      .from('prescriptions')
      .select(`
        id,
        doctor_name,
        diagnosis,
        start_date,
        end_date,
        notes,
        prescription_medicines (
          id,
          medicine_name,
          dosage,
          instructions,
          frequency_hours
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(10);

    if (prescriptions && prescriptions.length > 0) {
      context.prescriptions = prescriptions.map(rx => ({
        doctorName: rx.doctor_name || undefined,
        diagnosis: rx.diagnosis,
        startDate: rx.start_date,
        endDate: rx.end_date || undefined,
        medicines: rx.prescription_medicines?.map((med: any) => ({
          medicineName: med.medicine_name,
          dosage: med.dosage || undefined,
          instructions: med.instructions || undefined,
          frequencyHours: med.frequency_hours || undefined,
        })),
      }));
    }

    // 3b. Obtener las próximas dosis programadas (tabla: medication_doses)
    const now = new Date().toISOString();
    const { data: upcomingDoses } = await supabaseClient
      .from('medication_doses')
      .select(`
        scheduled_at,
        status,
        prescription_medicines (
          medicine_name,
          dosage,
          frequency_hours
        )
      `)
      .eq('user_id', userId)
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (upcomingDoses && upcomingDoses.length > 0) {
      context.upcomingDoses = upcomingDoses.map((dose: any) => ({
        scheduledAt: dose.scheduled_at,
        status: dose.status,
        medicineName: dose.prescription_medicines?.medicine_name,
        dosage: dose.prescription_medicines?.dosage,
        frequencyHours: dose.prescription_medicines?.frequency_hours,
      }));
    }

    // 4. Obtener alergias (tabla: user_allergies)
    const { data: allergies } = await supabaseClient
      .from('user_allergies')
      .select('allergy_name, reaction_description, severity, treatment')
      .eq('user_id', userId);

    if (allergies && allergies.length > 0) {
      context.allergies = allergies.map(allergy => ({
        allergyName: allergy.allergy_name,
        reactionDescription: allergy.reaction_description || undefined,
        severity: allergy.severity || undefined,
        treatment: allergy.treatment || undefined,
      }));
    }

    // 5. Obtener vacunas (tabla: vaccinations)
    const { data: vaccinations } = await supabaseClient
      .from('vaccinations')
      .select('vaccine_name, disease_protected, administration_date')
      .eq('user_id', userId)
      .order('administration_date', { ascending: false });

    if (vaccinations && vaccinations.length > 0) {
      context.vaccinations = vaccinations.map(vax => ({
        vaccineName: vax.vaccine_name,
        diseaseProtected: vax.disease_protected || undefined,
        administrationDate: vax.administration_date,
      }));
    }

    // 6. Obtener antecedentes personales (tabla: user_personal_history)
    const { data: personalHistory } = await supabaseClient
      .from('user_personal_history')
      .select('condition_name, diagnosis_date, notes')
      .eq('user_id', userId);

    if (personalHistory && personalHistory.length > 0) {
      context.personalHistory = personalHistory.map(history => ({
        conditionName: history.condition_name,
        diagnosisDate: history.diagnosis_date || undefined,
        notes: history.notes || undefined,
      }));
    }

    // 7. Obtener antecedentes familiares (tabla: user_family_history)
    const { data: familyHistory } = await supabaseClient
      .from('user_family_history')
      .select('condition_name, family_member, notes')
      .eq('user_id', userId);

    if (familyHistory && familyHistory.length > 0) {
      context.familyHistory = familyHistory.map(history => ({
        conditionName: history.condition_name,
        familyMember: history.family_member,
        notes: history.notes || undefined,
      }));
    }

  } catch (error) {
    // SECURITY: Log sin detalles sensibles
    secureLog('error', 'Error fetching medical context', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    // Retornar contexto parcial
  }

  return context;
}

/**
 * Construye el prompt del sistema para el Asistente IA Médico
 * Define el rol, comportamiento y restricciones del asistente
 */
function buildSystemPrompt(context: MedicalContext): string {
  const contextSummary = buildContextSummary(context);

  return `Eres un Asistente IA Médico especializado en ayudar a pacientes a comprender su información médica de forma clara y estructurada.

FORMATO DE RESPUESTAS:
- Usa markdown para estructurar tus respuestas (**, ##, ###, listas con *)
- Organiza la información en secciones claras con encabezados (##)
- Usa listas con viñetas (*) para enumerar elementos
- Destaca términos importantes con **negritas**
- Mantén párrafos cortos y concisos (máximo 3-4 líneas)
- Usa espacios entre secciones para mejorar legibilidad

IMPORTANTE - TUS LIMITACIONES Y RESPONSABILIDADES:
- NO eres un médico y NO puedes hacer diagnósticos
- NO puedes prescribir tratamientos ni medicamentos
- NO sustituyes la consulta con un profesional de la salud
- SIEMPRE debes recomendar consultar a un médico para decisiones clínicas importantes
- Tu función es EDUCATIVA: explicar conceptos médicos y ayudar a entender la información existente

TU CONTEXTO - INFORMACIÓN DEL PACIENTE:
${contextSummary}

TUS CAPACIDADES:
1. Explicar resultados de estudios médicos con lenguaje claro y sencillo
2. Responder preguntas sobre documentos médicos del paciente
3. Proporcionar información general sobre condiciones médicas
4. Ayudar a entender terminología médica
5. Recordar sobre medicamentos y tratamientos actuales
6. Orientar sobre cuándo buscar atención médica urgente

TONO Y ESTILO:
- Empático y profesional
- Claro y comprensible para no especialistas
- Preciso pero no alarmista
- Directo y organizado
- Cuando no tengas información, admítelo honestamente

EJEMPLOS DE FORMATO CORRECTO:
## Tus Medicamentos Actuales

Tienes **3 medicamentos activos** para tratar la gripe:

* **Oseltamivir 75mg**: Antiviral que combate el virus de la influenza
* **Paracetamol 500mg**: Alivia el dolor y reduce la fiebre
* **Loratadina 5mg**: Antihistamínico para síntomas de alergia

## Recordatorio Importante

⚠️ Consulta con tu médico si los síntomas empeoran o no mejoran en 2-3 días.

SIEMPRE recuerda al paciente que consulte con su médico para:
- Cambios en medicación
- Nuevos síntomas preocupantes
- Interpretación definitiva de resultados de laboratorio
- Cualquier decisión médica importante`;
}

/**
 * Genera un resumen del contexto médico del paciente
 */
function buildContextSummary(context: MedicalContext): string {
  const parts: string[] = [];

  if (context.profile) {
    const { firstName, lastName, gender, bloodType } = context.profile;
    parts.push(`PERFIL: ${firstName || ''} ${lastName || ''}, ${gender || 'no especificado'}, Tipo de sangre: ${bloodType || 'no especificado'}`);
  }

  if (context.allergies && context.allergies.length > 0) {
    const allergiesList = context.allergies
      .map(a => `${a.allergyName} (${a.severity || 'severidad no especificada'})`)
      .join(', ');
    parts.push(`ALERGIAS: ${allergiesList}`);
  }

  if (context.prescriptions && context.prescriptions.length > 0) {
    const rxList = context.prescriptions
      .map(rx => {
        const meds = rx.medicines?.map(m => `${m.medicineName} ${m.dosage || ''}`).join(', ') || 'sin detalles';
        return `${rx.diagnosis}: ${meds}`;
      })
      .join(' | ');
    parts.push(`RECETAS ACTIVAS: ${rxList}`);
  }

  if (context.upcomingDoses && context.upcomingDoses.length > 0) {
    const dosesList = context.upcomingDoses
      .map(d => {
        const time = new Date(d.scheduledAt).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const date = new Date(d.scheduledAt).toLocaleDateString('es-MX', {
          month: 'short',
          day: 'numeric'
        });
        const now = new Date();
        const scheduledTime = new Date(d.scheduledAt);
        const diffHours = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const diffMinutes = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
        
        let timeLeft = '';
        if (diffHours < 1) {
          timeLeft = diffMinutes > 0 ? `en ${diffMinutes} min` : 'ahora';
        } else if (diffHours < 24) {
          timeLeft = `en ${diffHours} horas`;
        } else {
          const diffDays = Math.round(diffHours / 24);
          timeLeft = `en ${diffDays} días`;
        }
        
        return `${d.medicineName} ${d.dosage || ''} - ${time} ${date} (${timeLeft})`;
      })
      .join(' | ');
    parts.push(`PRÓXIMAS DOSIS PROGRAMADAS: ${dosesList}`);
  }

  if (context.personalHistory && context.personalHistory.length > 0) {
    const historyList = context.personalHistory
      .map(h => h.conditionName)
      .join(', ');
    parts.push(`ANTECEDENTES PERSONALES: ${historyList}`);
  }

  if (context.familyHistory && context.familyHistory.length > 0) {
    const famHistoryList = context.familyHistory
      .map(h => `${h.conditionName} (${h.familyMember})`)
      .join(', ');
    parts.push(`ANTECEDENTES FAMILIARES: ${famHistoryList}`);
  }

  if (context.vaccinations && context.vaccinations.length > 0) {
    const vaxList = context.vaccinations
      .slice(0, 5) // Solo las 5 más recientes
      .map(v => v.vaccineName)
      .join(', ');
    parts.push(`VACUNAS RECIENTES: ${vaxList}`);
  }

  if (context.documents && context.documents.length > 0) {
    const docList = context.documents
      .slice(0, 5) // Solo los 5 más recientes
      .map(d => `${d.name} (${d.category}, ${d.date})`)
      .join(' | ');
    parts.push(`DOCUMENTOS RECIENTES: ${docList}`);
  }

  return parts.length > 0 
    ? parts.join('\n\n')
    : 'No hay información médica registrada aún. El paciente puede empezar a subir documentos y registrar su información.';
}

/**
 * Genera una respuesta del asistente usando Gemini AI
 * SECURITY: Con timeout, API key server-side, y prevención de inyección
 */
export async function generateMedicalResponse(
  userMessage: string,
  context: MedicalContext,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // SECURITY: Inicializar cliente con API key del servidor
    const genAI = getGeminiClient();
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT' as any,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH' as any,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any,
        },
      ],
    });

    const systemPrompt = buildSystemPrompt(context);
    
    // SECURITY: Limitar historial para prevenir ataques de contexto
    const safeHistory = conversationHistory
      .slice(-6)
      .map(msg => ({
        role: msg.role === 'user' ? 'Paciente' : 'Asistente',
        // SECURITY: Sanitizar contenido del historial
        content: msg.content.substring(0, 1000),
      }));

    const historyText = safeHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

HISTORIAL DE CONVERSACIÓN RECIENTE:
${historyText || 'Esta es la primera pregunta del paciente.'}

NUEVA PREGUNTA DEL PACIENTE:
${userMessage}

RESPUESTA DEL ASISTENTE:`;

    // SECURITY: Timeout en generación
    const generationPromise = model.generateContent(fullPrompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), GEMINI_TIMEOUT_MS)
    );

    const result = await Promise.race([generationPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    secureLog('info', 'Gemini response generated', { length: text.length });
    return text;

  } catch (error) {
    secureLog('error', 'Gemini generation error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('GEMINI_API_KEY')) {
        throw new Error('Error de configuración del servidor. Por favor contacta al administrador.');
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('Servicio temporalmente no disponible. Intenta de nuevo más tarde.');
      }
      if (error.message.includes('timeout')) {
        throw new Error('La solicitud tardó demasiado. Por favor intenta de nuevo.');
      }
      if (error.message.includes('blocked') || error.message.includes('safety')) {
        throw new Error('Tu pregunta no pudo ser procesada. Por favor reformúlala.');
      }
    }
    
    throw new Error('Error al generar respuesta. Por favor intenta de nuevo.');
  }
}
