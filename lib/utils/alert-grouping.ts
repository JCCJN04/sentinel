import { UnifiedAlert } from '@/lib/actions/alerts.actions';

export type AlertPriority = 'crítica' | 'alta' | 'media' | 'baja';

export interface GroupedAlerts {
  crítica: UnifiedAlert[];
  alta: UnifiedAlert[];
  media: UnifiedAlert[];
  baja: UnifiedAlert[];
}

/**
 * Agrupa alertas por prioridad
 */
export function groupAlertsByPriority(alerts: UnifiedAlert[]): GroupedAlerts {
  return {
    crítica: alerts.filter(a => a.priority === 'crítica'),
    alta: alerts.filter(a => a.priority === 'alta'),
    media: alerts.filter(a => a.priority === 'media'),
    baja: alerts.filter(a => a.priority === 'baja'),
  };
}

/**
 * Obtiene el orden de prioridades para mostrar
 */
export function getPriorityOrder(): AlertPriority[] {
  return ['crítica', 'alta', 'media', 'baja'];
}

/**
 * Obtiene el color de borde para cada grupo de prioridad
 */
export function getPriorityGroupColor(priority: AlertPriority): string {
  switch (priority) {
    case 'crítica':
      return 'border-l-red-500';
    case 'alta':
      return 'border-l-orange-500';
    case 'media':
      return 'border-l-yellow-500';
    case 'baja':
      return 'border-l-gray-500';
  }
}

/**
 * Obtiene el ícono de color para cada grupo de prioridad
 */
export function getPriorityGroupBgColor(priority: AlertPriority): string {
  switch (priority) {
    case 'crítica':
      return 'bg-red-50 dark:bg-red-950/20';
    case 'alta':
      return 'bg-orange-50 dark:bg-orange-950/20';
    case 'media':
      return 'bg-yellow-50 dark:bg-yellow-950/20';
    case 'baja':
      return 'bg-gray-50 dark:bg-gray-950/20';
  }
}

/**
 * Obtiene la etiqueta de texto para cada prioridad
 */
export function getPriorityLabel(priority: AlertPriority): string {
  switch (priority) {
    case 'crítica':
      return 'Alertas Críticas';
    case 'alta':
      return 'Prioridad Alta';
    case 'media':
      return 'Prioridad Media';
    case 'baja':
      return 'Prioridad Baja';
  }
}
