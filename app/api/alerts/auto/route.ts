import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { calculateSmartPriority, getDaysUntilDate } from '@/lib/smart-priority';
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
const autoAlertSchema = z.object({
  event_type: z.enum([
    'document_expiring',
    'medication_reminder',
    'vaccine_due',
    'appointment_reminder',
    'insurance_renewal',
    'family_member_shared',
    'security_alert'
  ]),
  user_id: z.string().uuid(),
  data: z.record(z.unknown()).optional()
});

// Endpoint para generar alertas automáticas basadas en eventos del sistema
export async function POST(request: NextRequest) {
  try {
    // Verificar API key para seguridad
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      secureLog('warn', 'Unauthorized auto alert creation attempt', {
        ip,
        hasApiKey: !!apiKey
      });
      
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = autoAlertSchema.safeParse(body);
    if (!validationResult.success) {
      secureLog('warn', 'Invalid auto alert data', {
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

    const { event_type, user_id, data } = validationResult.data;

    // Usar service role client para bypassear RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    let alertData: any = {
      user_id,
      type: 'custom',
      priority: 'media',
      metadata: data || {}
    };

    // Generar alerta según el tipo de evento
    switch (event_type) {
      case 'document_expiring':
        const expiryDate = typeof data?.expiry_date === 'string' ? data.expiry_date : '';
        const documentName = typeof data?.document_name === 'string' ? data.document_name : 'documento';
        const daysUntilExpiry = getDaysUntilDate(expiryDate);
        const smartPriority = calculateSmartPriority({
          type: 'document_reminder',
          daysUntilEvent: daysUntilExpiry,
          metadata: {
            documentType: documentName,
            isRecurring: false
          },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        alertData = {
          ...alertData,
          title: 'Documento próximo a vencer',
          message: `Tu documento ${documentName} vencerá el ${expiryDate}`,
          type: 'document_reminder',
          priority: smartPriority,
          link: `/dashboard/documentos/${typeof data?.document_id === 'string' ? data.document_id : ''}`
        };
        break;

      case 'medication_reminder':
        const medicineName = typeof data?.medicine_name === 'string' ? data.medicine_name : 'medicamento';
        const dosage = typeof data?.dosage === 'string' ? data.dosage : '';
        alertData = {
          ...alertData,
          title: `Tomar ${medicineName}`,
          message: `Es hora de tomar ${medicineName} - ${dosage}`,
          type: 'medication',
          priority: 'crítica', // Medicación siempre es crítica
          link: '/dashboard/prescriptions',
          metadata: {
            ...data,
            medicine_name: medicineName,
            dosage: dosage
          }
        };
        break;

      case 'vaccine_due':
        const vaccineDate = typeof data?.due_date === 'string' ? data.due_date : '';
        const daysUntilVaccine = vaccineDate ? getDaysUntilDate(vaccineDate) : 15;
        const vaccinePriority = calculateSmartPriority({
          type: 'vaccine',
          daysUntilEvent: daysUntilVaccine,
          metadata: { isRecurring: false },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        const vaccineName = typeof data?.vaccine_name === 'string' ? data.vaccine_name : 'vacuna';
        alertData = {
          ...alertData,
          title: 'Vacuna pendiente',
          message: `Tienes pendiente la vacuna: ${vaccineName}`,
          type: 'vaccine',
          priority: vaccinePriority,
          link: '/dashboard/vacunas'
        };
        break;

      case 'appointment_reminder':
        const appointmentDate = typeof data?.appointment_date === 'string' ? data.appointment_date : '';
        const daysUntilAppointment = appointmentDate ? getDaysUntilDate(appointmentDate) : 7;
        const appointmentPriority = calculateSmartPriority({
          type: 'appointment',
          daysUntilEvent: daysUntilAppointment,
          metadata: { isRecurring: false },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        const appointmentType = typeof data?.appointment_type === 'string' ? data.appointment_type : 'cita';
        const appointmentDateStr = typeof data?.appointment_date === 'string' ? data.appointment_date : '';
        const appointmentLink = typeof data?.link === 'string' ? data.link : '/dashboard';
        alertData = {
          ...alertData,
          title: 'Recordatorio de cita',
          message: `Tienes una cita ${appointmentType} el ${appointmentDateStr}`,
          type: 'appointment',
          priority: appointmentPriority,
          link: appointmentLink
        };
        break;

      case 'insurance_renewal':
        const renewalDate = typeof data?.renewal_date === 'string' ? data.renewal_date : '';
        const daysUntilInsurance = renewalDate ? getDaysUntilDate(renewalDate) : 20;
        const insurancePriority = calculateSmartPriority({
          type: 'insurance',
          daysUntilEvent: daysUntilInsurance,
          metadata: {
            documentType: 'seguro',
            isRecurring: false
          },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        const insuranceType = typeof data?.insurance_type === 'string' ? data.insurance_type : 'seguro';
        alertData = {
          ...alertData,
          title: 'Renovación de seguro',
          message: `Tu seguro ${insuranceType} debe renovarse pronto`,
          type: 'insurance',
          priority: insurancePriority,
          link: '/dashboard/documentos'
        };
        break;

      case 'family_member_shared':
        const familyMemberName = typeof data?.family_member_name === 'string' ? data.family_member_name : 'Un familiar';
        const sharedDocId = typeof data?.document_id === 'string' ? data.document_id : '';
        alertData = {
          ...alertData,
          title: 'Documento compartido',
          message: `${familyMemberName} compartió un documento contigo`,
          type: 'family_activity',
          priority: 'media', // Actividad familiar no es urgente
          link: `/dashboard/documentos/${sharedDocId}`
        };
        break;

      case 'security_alert':
        const securityMessage = typeof data?.message === 'string' ? data.message : 'Se detectó actividad inusual en tu cuenta';
        alertData = {
          ...alertData,
          title: 'Alerta de seguridad',
          message: securityMessage,
          type: 'security_alert',
          priority: 'crítica', // Seguridad siempre es crítica
          link: '/dashboard/configuracion?tab=seguridad'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de evento no reconocido' },
          { status: 400 }
        );
    }

    // Verificar si ya existe una alerta similar reciente (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Para alertas de medicamentos, verificar también el nombre del medicamento
    let existingAlert = null;
    if (alertData.type === 'medication') {
      const { data: alerts } = await supabase
        .from('custom_alerts')
        .select('id, metadata')
        .eq('user_id', user_id)
        .eq('type', alertData.type)
        .eq('title', alertData.title)
        .gte('created_at', oneDayAgo);
      
      // Buscar si hay una alerta con el mismo medicamento y dosis
      const medicineNameFromData = typeof data?.medicine_name === 'string' ? data.medicine_name : '';
      const dosageFromData = typeof data?.dosage === 'string' ? data.dosage : '';
      
      existingAlert = alerts?.find(alert => 
        alert.metadata?.medicine_name === medicineNameFromData &&
        alert.metadata?.dosage === dosageFromData
      );
    } else {
      // Para otros tipos de alerta, usar la lógica original
      const { data: alert } = await supabase
        .from('custom_alerts')
        .select('id')
        .eq('user_id', user_id)
        .eq('type', alertData.type)
        .eq('title', alertData.title)
        .gte('created_at', oneDayAgo)
        .limit(1)
        .single();
      
      existingAlert = alert;
    }

    // No crear alerta duplicada
    if (existingAlert) {
      secureLog('info', 'Duplicate alert skipped', {
        userId: user_id,
        eventType: event_type,
        alertType: alertData.type
      });
      return NextResponse.json({ 
        message: 'Alerta similar ya existe',
        skipped: true 
      });
    }

    // Crear la alerta
    const { data: alert, error } = await supabase
      .from('custom_alerts')
      .insert(alertData)
      .select()
      .single();

    if (error) {
      secureLog('error', 'Failed to create auto alert', {
        userId: user_id,
        eventType: event_type,
        errorMessage: error.message
      });
      return NextResponse.json(
        { error: 'Error al crear la alerta' },
        { status: 500 }
      );
    }

    secureLog('info', 'Auto alert created successfully', {
      userId: user_id,
      eventType: event_type,
      alertId: alert.id,
      alertType: alert.type,
      priority: alert.priority
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    secureLog('error', 'Unexpected error in POST /api/alerts/auto', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
