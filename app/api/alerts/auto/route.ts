import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateSmartPriority, getDaysUntilDate } from '@/lib/smart-priority';

// Endpoint para generar alertas automáticas basadas en eventos del sistema
export async function POST(request: NextRequest) {
  try {
    // Verificar API key para seguridad
    const apiKey = request.headers.get('x-api-key');
    
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_type, user_id, data } = body;

    if (!event_type || !user_id) {
      return NextResponse.json(
        { error: 'event_type y user_id son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let alertData: any = {
      user_id,
      type: 'custom',
      priority: 'media',
      metadata: data || {}
    };

    // Generar alerta según el tipo de evento
    switch (event_type) {
      case 'document_expiring':
        const daysUntilExpiry = getDaysUntilDate(data?.expiry_date);
        const smartPriority = calculateSmartPriority({
          type: 'document_reminder',
          daysUntilEvent: daysUntilExpiry,
          metadata: {
            documentType: data?.document_name || '',
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
          message: `Tu documento ${data?.document_name} vencerá el ${data?.expiry_date}`,
          type: 'document_reminder',
          priority: smartPriority,
          link: `/dashboard/documentos/${data?.document_id}`
        };
        break;

      case 'medication_reminder':
        alertData = {
          ...alertData,
          title: 'Recordatorio de medicamento',
          message: `Es hora de tomar ${data?.medicine_name} - ${data?.dosage}`,
          type: 'medication',
          priority: 'crítica', // Medicación siempre es crítica
          link: '/dashboard/prescriptions'
        };
        break;

      case 'vaccine_due':
        const daysUntilVaccine = data?.due_date ? getDaysUntilDate(data.due_date) : 15;
        const vaccinePriority = calculateSmartPriority({
          type: 'vaccine',
          daysUntilEvent: daysUntilVaccine,
          metadata: { isRecurring: false },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        alertData = {
          ...alertData,
          title: 'Vacuna pendiente',
          message: `Tienes pendiente la vacuna: ${data?.vaccine_name}`,
          type: 'vaccine',
          priority: vaccinePriority,
          link: '/dashboard/vacunas'
        };
        break;

      case 'appointment_reminder':
        const daysUntilAppointment = data?.appointment_date ? getDaysUntilDate(data.appointment_date) : 7;
        const appointmentPriority = calculateSmartPriority({
          type: 'appointment',
          daysUntilEvent: daysUntilAppointment,
          metadata: { isRecurring: false },
          userHistory: {
            hasIgnoredBefore: false,
            timesPostponed: 0
          }
        });
        
        alertData = {
          ...alertData,
          title: 'Recordatorio de cita',
          message: `Tienes una cita ${data?.appointment_type} el ${data?.appointment_date}`,
          type: 'appointment',
          priority: appointmentPriority,
          link: data?.link || '/dashboard'
        };
        break;

      case 'insurance_renewal':
        const daysUntilInsurance = data?.renewal_date ? getDaysUntilDate(data.renewal_date) : 20;
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
        
        alertData = {
          ...alertData,
          title: 'Renovación de seguro',
          message: `Tu seguro ${data?.insurance_type} debe renovarse pronto`,
          type: 'insurance',
          priority: insurancePriority,
          link: '/dashboard/documentos'
        };
        break;

      case 'family_member_shared':
        alertData = {
          ...alertData,
          title: 'Documento compartido',
          message: `${data?.family_member_name} compartió un documento contigo`,
          type: 'family_activity',
          priority: 'media', // Actividad familiar no es urgente
          link: `/dashboard/documentos/${data?.document_id}`
        };
        break;

      case 'security_alert':
        alertData = {
          ...alertData,
          title: 'Alerta de seguridad',
          message: data?.message || 'Se detectó actividad inusual en tu cuenta',
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
    const { data: existingAlert } = await supabase
      .from('custom_alerts')
      .select('id')
      .eq('user_id', user_id)
      .eq('type', alertData.type)
      .eq('title', alertData.title)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .single();

    // No crear alerta duplicada
    if (existingAlert) {
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
      console.error('Error al crear alerta automática:', error);
      return NextResponse.json(
        { error: 'Error al crear la alerta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/alerts/auto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
