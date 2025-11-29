/**
 * Servicio para generar alertas automáticas basadas en eventos del sistema
 * 
 * NOTA: Este archivo es seguro para importar desde componentes cliente.
 * Las funciones de cron que necesitan server-side están en alerts-cron.ts
 */

export type AutoAlertEvent = 
  | 'document_expiring'
  | 'medication_reminder'
  | 'vaccine_due'
  | 'appointment_reminder'
  | 'insurance_renewal'
  | 'family_member_shared'
  | 'security_alert';

export interface AutoAlertParams {
  event_type: AutoAlertEvent;
  user_id: string;
  data?: Record<string, any>;
}

/**
 * Genera una alerta automática llamando al endpoint interno
 */
export async function generateAutoAlert(params: AutoAlertParams): Promise<boolean> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!appUrl) {
      console.error('❌ NEXT_PUBLIC_APP_URL no está configurada');
      return false;
    }

    if (!apiKey) {
      console.warn('⚠️ INTERNAL_API_KEY no está configurada, la API podría rechazar la petición');
    }

    console.log('📤 Generando alerta automática:', {
      event_type: params.event_type,
      user_id: params.user_id,
      url: `${appUrl}/api/alerts/auto`
    });

    const response = await fetch(`${appUrl}/api/alerts/auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al generar alerta automática:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return false;
    }

    const result = await response.json();
    console.log('✅ Alerta generada exitosamente:', result);
    return true;
  } catch (error) {
    console.error('❌ Error al generar alerta automática:', error);
    return false;
  }
}
