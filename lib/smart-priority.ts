/**
 * Sistema de priorización inteligente de alertas
 * Calcula la prioridad basado en múltiples factores
 */

export type AlertPriority = 'baja' | 'media' | 'alta' | 'crítica';
export type AlertType = 'document_reminder' | 'medication' | 'vaccine' | 'appointment' | 'insurance' | 'security_alert' | 'custom' | 'family_activity';

export interface PriorityCalculationParams {
  type: AlertType;
  daysUntilEvent?: number;
  userHistory?: {
    hasIgnoredBefore?: boolean;
    previousCompletionRate?: number;
    timesPostponed?: number;
  };
  metadata?: {
    documentType?: string;
    isRecurring?: boolean;
    relatedAlertCount?: number;
  };
}

/**
 * Calcula la prioridad de una alerta basado en múltiples factores
 */
export function calculateSmartPriority(params: PriorityCalculationParams): AlertPriority {
  const { type, daysUntilEvent, userHistory, metadata } = params;
  
  // Regla 1: Tipos que siempre son críticos
  if (type === 'medication') return 'crítica';
  if (type === 'security_alert') return 'crítica';
  
  // Regla 2: Documentos importantes siempre son altos
  if (type === 'document_reminder' && metadata?.documentType) {
    const criticalDocs = ['pasaporte', 'visa', 'cedula', 'licencia'];
    if (criticalDocs.some(doc => metadata.documentType?.toLowerCase().includes(doc))) {
      if (daysUntilEvent && daysUntilEvent <= 7) return 'crítica';
      if (daysUntilEvent && daysUntilEvent <= 15) return 'alta';
    }
  }
  
  // Regla 3: Basado en tiempo restante
  if (daysUntilEvent !== undefined) {
    // Ya vencido o vence hoy
    if (daysUntilEvent <= 0) return 'crítica';
    
    // Vence en 1-3 días
    if (daysUntilEvent <= 3) return 'crítica';
    
    // Vence en 4-7 días
    if (daysUntilEvent <= 7) return 'alta';
    
    // Vence en 8-15 días
    if (daysUntilEvent <= 15) return 'alta';
    
    // Vence en 16-30 días
    if (daysUntilEvent <= 30) return 'media';
  }
  
  // Regla 4: Usuario ha ignorado antes - escalar prioridad
  if (userHistory?.hasIgnoredBefore && daysUntilEvent && daysUntilEvent <= 10) {
    return 'alta';
  }
  
  // Regla 5: Usuario ha pospuesto muchas veces - escalar
  if (userHistory?.timesPostponed && userHistory.timesPostponed >= 3) {
    return 'alta';
  }
  
  // Regla 6: Seguros y vacunas tienen prioridad especial
  if (type === 'insurance' && daysUntilEvent && daysUntilEvent <= 30) {
    return 'alta';
  }
  
  if (type === 'vaccine' && daysUntilEvent && daysUntilEvent <= 14) {
    return 'alta';
  }
  
  // Regla 7: Alertas recurrentes importantes
  if (metadata?.isRecurring && daysUntilEvent && daysUntilEvent <= 5) {
    return 'alta';
  }
  
  // Default: media
  return 'media';
}

/**
 * Obtiene un mensaje contextual basado en la prioridad y días restantes
 */
export function getPriorityMessage(priority: AlertPriority, daysUntilEvent?: number): string {
  if (priority === 'crítica') {
    if (daysUntilEvent !== undefined && daysUntilEvent <= 0) {
      return '¡Urgente! Acción inmediata requerida';
    }
    return '¡Atención urgente requerida!';
  }
  
  if (priority === 'alta') {
    if (daysUntilEvent !== undefined) {
      return `Atender pronto - ${daysUntilEvent} días restantes`;
    }
    return 'Requiere atención pronto';
  }
  
  if (priority === 'media') {
    return 'Atender cuando sea posible';
  }
  
  return 'Para tu información';
}

/**
 * Calcula días hasta un evento desde una fecha string
 */
export function getDaysUntilDate(dateString: string): number {
  const eventDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Sugiere la mejor acción para el usuario basado en la alerta
 */
export function suggestAction(params: PriorityCalculationParams): string {
  const { type, daysUntilEvent } = params;
  
  if (type === 'medication') {
    return 'Tomar medicamento ahora';
  }
  
  if (type === 'document_reminder') {
    if (daysUntilEvent && daysUntilEvent <= 7) {
      return 'Renovar documento inmediatamente';
    }
    if (daysUntilEvent && daysUntilEvent <= 30) {
      return 'Iniciar proceso de renovación';
    }
    return 'Agendar recordatorio para renovar';
  }
  
  if (type === 'vaccine') {
    return 'Agendar cita de vacunación';
  }
  
  if (type === 'appointment') {
    return 'Confirmar asistencia';
  }
  
  if (type === 'insurance') {
    return 'Contactar a aseguradora';
  }
  
  if (type === 'security_alert') {
    return 'Revisar actividad de cuenta';
  }
  
  return 'Revisar detalles';
}
