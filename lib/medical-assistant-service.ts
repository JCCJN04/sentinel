/**
 * Servicio del Asistente IA Médico
 * 
 * Este servicio se encarga de:
 * 1. Consultar la información médica del paciente desde Supabase
 * 2. Construir el contexto médico completo
 * 3. Generar respuestas inteligentes usando Google Gemini AI
 * 
 * Tablas utilizadas del esquema PostgreSQL:
 * - documents: Documentos médicos del paciente
 * - prescriptions + prescription_medicines: Recetas y medicamentos
 * - user_allergies: Alergias reportadas
 * - vaccinations: Registro de vacunación
 * - user_personal_history: Antecedentes patológicos personales
 * - user_family_history: Antecedentes familiares
 * - profiles: Información personal del usuario
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MedicalContext, ChatMessage } from '@/types/medical-assistant';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

/**
 * Obtiene el contexto médico completo del paciente desde Supabase
 * Consulta todas las tablas relevantes del esquema de base de datos
 */
export async function getMedicalContext(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<MedicalContext> {
  const context: MedicalContext = {};

  try {
    // 1. Obtener perfil del usuario (tabla: profiles)
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
    console.error('Error fetching medical context:', error);
    // En caso de error, retornamos el contexto parcial que se haya podido obtener
  }

  return context;
}

/**
 * Construye el prompt del sistema para el Asistente IA Médico
 * Define el rol, comportamiento y restricciones del asistente
 */
function buildSystemPrompt(context: MedicalContext): string {
  const contextSummary = buildContextSummary(context);

  return `Eres un Asistente IA Médico especializado en ayudar a pacientes a comprender su información médica.

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
- Cuando no tengas información, admítelo honestamente

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
 */
export async function generateMedicalResponse(
  userMessage: string,
  context: MedicalContext,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // Verificar que la API key esté configurada
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.error('❌ Gemini API Key no configurada correctamente');
      throw new Error('La API Key de Gemini no está configurada. Por favor configura NEXT_PUBLIC_GEMINI_API_KEY en tu archivo .env.local');
    }

    console.log('🤖 Inicializando Gemini AI...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    // Construir el prompt completo
    const systemPrompt = buildSystemPrompt(context);
    
    // Convertir historial de conversación a formato de texto
    const historyText = conversationHistory
      .slice(-6) // Solo últimos 6 mensajes para mantener el contexto manejable
      .map(msg => `${msg.role === 'user' ? 'Paciente' : 'Asistente'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

HISTORIAL DE CONVERSACIÓN RECIENTE:
${historyText || 'Esta es la primera pregunta del paciente.'}

NUEVA PREGUNTA DEL PACIENTE:
${userMessage}

RESPUESTA DEL ASISTENTE:`;

    console.log('📝 Generando respuesta con Gemini...');
    
    // Generar respuesta
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Respuesta generada exitosamente');
    return text;

  } catch (error) {
    console.error('❌ Error generating medical response:', error);
    
    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Error de autenticación con Gemini AI. Verifica tu API Key.');
      }
      if (error.message.includes('quota')) {
        throw new Error('Has excedido el límite de uso de Gemini AI. Intenta de nuevo más tarde.');
      }
      if (error.message.includes('blocked')) {
        throw new Error('La pregunta fue bloqueada por razones de seguridad. Intenta reformularla.');
      }
      throw new Error(`Error de Gemini AI: ${error.message}`);
    }
    
    throw new Error('No pude generar una respuesta en este momento. Por favor, intenta de nuevo.');
  }
}

/**
 * Valida el mensaje del usuario antes de procesarlo
 */
export function validateUserMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'El mensaje no puede estar vacío' };
  }

  if (message.length > 2000) {
    return { valid: false, error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' };
  }

  return { valid: true };
}
