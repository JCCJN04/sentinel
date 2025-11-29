/**
 * Tipos TypeScript para el Sistema de Alertas
 * Importar según necesidad en tus archivos
 */

// ============================================
// TIPOS DE BASE DE DATOS
// ============================================

export type AlertType = 
  | 'document_reminder'
  | 'medication'
  | 'vaccine'
  | 'appointment'
  | 'insurance'
  | 'custom'
  | 'family_activity'
  | 'security_alert';

export type AlertPriority = 'baja' | 'media' | 'alta' | 'crítica';

export type AlertStatus = 'pendiente' | 'completada' | 'pospuesta' | 'cancelada' | 'info';

export type AlertRecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface AlertRecurrence {
  frequency: AlertRecurrenceFrequency;
  interval: number;
  end_date?: string;
}

export interface CustomAlert {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  is_read: boolean;
  link: string | null;
  metadata: Record<string, any>;
  trigger_date: string | null;
  expiry_date: string | null;
  recurrence: AlertRecurrence | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TIPOS DE API
// ============================================

export interface CreateAlertRequest {
  title: string;
  message: string;
  type?: AlertType;
  priority?: AlertPriority;
  link?: string;
  trigger_date?: string;
  expiry_date?: string;
  recurrence?: AlertRecurrence;
  metadata?: Record<string, any>;
}

export interface UpdateAlertRequest {
  status?: AlertStatus;
  is_read?: boolean;
  title?: string;
  message?: string;
  priority?: AlertPriority;
}

export interface GetAlertsRequest {
  status?: AlertStatus;
  type?: AlertType;
  priority?: AlertPriority;
  unread?: boolean;
  limit?: number;
  offset?: number;
}

export interface AlertsResponse {
  alerts: CustomAlert[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface AlertResponse {
  alert: CustomAlert;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

// ============================================
// TIPOS PARA SERVER ACTIONS
// ============================================

export interface ServerActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export type CreateAlertResult = ServerActionResult<CustomAlert>;
export type UpdateAlertResult = ServerActionResult;
export type DeleteAlertResult = ServerActionResult;
export type GetAlertsResult = ServerActionResult<CustomAlert[]>;

// ============================================
// TIPOS PARA ALERTAS AUTOMÁTICAS
// ============================================

export type AutoAlertEvent = 
  | 'document_expiring'
  | 'medication_reminder'
  | 'vaccine_due'
  | 'appointment_reminder'
  | 'insurance_renewal'
  | 'family_member_shared'
  | 'security_alert';

export interface AutoAlertData {
  // Para document_expiring
  document_id?: string;
  document_name?: string;
  expiry_date?: string;
  days_until_expiry?: number;

  // Para medication_reminder
  medicine_name?: string;
  dosage?: string;
  scheduled_at?: string;
  dose_id?: string;
  prescription_id?: string;

  // Para vaccine_due
  vaccine_name?: string;
  next_dose_date?: string;
  days_until_next_dose?: number;

  // Para appointment_reminder
  appointment_type?: string;
  appointment_date?: string;

  // Para insurance_renewal
  insurance_type?: string;

  // Para family_member_shared
  family_member_name?: string;

  // Para security_alert
  message?: string;
  ip_address?: string;
  location?: string;
  device?: string;
  timestamp?: string;

  // Comunes
  link?: string;
}

export interface AutoAlertParams {
  event_type: AutoAlertEvent;
  user_id: string;
  data?: AutoAlertData;
}

// ============================================
// TIPOS PARA HOOKS DE INTEGRACIÓN
// ============================================

export interface DocumentUploadedParams {
  documentId: string;
  documentName: string;
  expiryDate: string;
  userId: string;
}

export interface FamilyMemberSharedParams {
  documentId: string;
  documentName: string;
  familyMemberName: string;
  recipientUserId: string;
}

export interface PrescriptionCreatedParams {
  userId: string;
  prescriptionId: string;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency_hours: number;
  }>;
  startDate: string;
}

export interface SuspiciousLoginParams {
  userId: string;
  ipAddress: string;
  location?: string;
  device?: string;
}

export interface PasswordChangedParams {
  userId: string;
}

export interface VaccineAddedParams {
  userId: string;
  vaccineName: string;
  administrationDate: string;
  nextDoseDate?: string;
}

export interface InsuranceExpiringParams {
  userId: string;
  insuranceType: string;
  expiryDate: string;
  documentId?: string;
}

// ============================================
// TIPOS PARA COMPONENTES UI
// ============================================

export interface AlertListProps {
  alerts: CustomAlert[];
}

export interface AlertCardProps {
  alert: CustomAlert;
  onUpdate?: (alertId: string, status: AlertStatus) => void;
  onDelete?: (alertId: string) => void;
  isSelected?: boolean;
  onSelect?: (alertId: string) => void;
}

export interface AlertFilterProps {
  onFilterChange: (filters: AlertFilters) => void;
}

export interface AlertFilters {
  search?: string;
  status?: AlertStatus;
  type?: AlertType;
  priority?: AlertPriority;
  unreadOnly?: boolean;
}

export interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ============================================
// TIPOS PARA ESTADÍSTICAS
// ============================================

export interface AlertStats {
  total: number;
  pending: number;
  completed: number;
  postponed: number;
  unread: number;
  byPriority: {
    crítica: number;
    alta: number;
    media: number;
    baja: number;
  };
  byType?: {
    [key in AlertType]?: number;
  };
}

// ============================================
// TIPOS PARA CRON JOBS
// ============================================

export type CronTask = 'check-alerts' | 'cleanup' | 'all';

export interface CronJobRequest {
  task: CronTask;
}

export interface CronJobResponse {
  success: boolean;
  task: CronTask;
  timestamp: string;
  results?: {
    alertsCreated?: number;
    alertsDeleted?: number;
    errors?: string[];
  };
}

// ============================================
// GUARDS DE TIPOS (Type Guards)
// ============================================

export function isCustomAlert(obj: any): obj is CustomAlert {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.message === 'string'
  );
}

export function isAlertType(value: string): value is AlertType {
  return [
    'document_reminder',
    'medication',
    'vaccine',
    'appointment',
    'insurance',
    'custom',
    'family_activity',
    'security_alert'
  ].includes(value);
}

export function isAlertPriority(value: string): value is AlertPriority {
  return ['baja', 'media', 'alta', 'crítica'].includes(value);
}

export function isAlertStatus(value: string): value is AlertStatus {
  return ['pendiente', 'completada', 'pospuesta', 'cancelada', 'info'].includes(value);
}

// ============================================
// CONSTANTES
// ============================================

export const ALERT_TYPES: readonly AlertType[] = [
  'document_reminder',
  'medication',
  'vaccine',
  'appointment',
  'insurance',
  'custom',
  'family_activity',
  'security_alert'
] as const;

export const ALERT_PRIORITIES: readonly AlertPriority[] = [
  'baja',
  'media',
  'alta',
  'crítica'
] as const;

export const ALERT_STATUSES: readonly AlertStatus[] = [
  'pendiente',
  'completada',
  'pospuesta',
  'cancelada',
  'info'
] as const;

// ============================================
// HELPERS DE TIPOS
// ============================================

export type PartialAlert = Partial<CustomAlert>;
export type AlertUpdate = Pick<CustomAlert, 'id'> & Partial<Omit<CustomAlert, 'id' | 'user_id' | 'created_at'>>;
export type NewAlert = Omit<CustomAlert, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// EJEMPLO DE USO
// ============================================

/**
 * Ejemplo de uso en un componente:
 * 
 * import { CustomAlert, AlertPriority, isAlertType } from '@/types/alerts';
 * 
 * function MyComponent({ alerts }: { alerts: CustomAlert[] }) {
 *   const highPriorityAlerts = alerts.filter(a => a.priority === 'alta');
 *   return <div>{highPriorityAlerts.map(...)}</div>;
 * }
 */

/**
 * Ejemplo de uso en server action:
 * 
 * import { CreateAlertRequest, CreateAlertResult } from '@/types/alerts';
 * 
 * export async function createAlert(
 *   data: CreateAlertRequest
 * ): Promise<CreateAlertResult> {
 *   // ...
 * }
 */
