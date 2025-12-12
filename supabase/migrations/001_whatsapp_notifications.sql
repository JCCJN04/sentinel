-- ============================================================================
-- MIGRACIÓN: Sistema de Notificaciones WhatsApp para Recordatorios de Medicamentos
-- Fecha: 2024-12-11
-- Autor: Senior Backend Engineer
-- 
-- PRERREQUISITOS:
--   - Tablas existentes: profiles, prescriptions, prescription_medicines, medication_doses
--   - Extension pg_cron habilitada en Supabase (Dashboard > Database > Extensions)
-- ============================================================================

-- ============================================================================
-- FASE 2.1: ALTERACIONES MÍNIMAS A TABLAS EXISTENTES
-- ============================================================================

-- Agregar campo whatsapp_enabled a profiles (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'whatsapp_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.profiles.whatsapp_enabled IS 'Indica si el usuario tiene habilitados los recordatorios por WhatsApp';
  END IF;
END $$;

-- Agregar campo first_dose_time a prescription_medicines (hora de primera toma)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'prescription_medicines' 
    AND column_name = 'first_dose_time'
  ) THEN
    ALTER TABLE public.prescription_medicines ADD COLUMN first_dose_time TIME DEFAULT '08:00:00';
    COMMENT ON COLUMN public.prescription_medicines.first_dose_time IS 'Hora de la primera toma del día (formato 24h)';
  END IF;
END $$;

-- Agregar campo reminder_enabled a prescription_medicines
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'prescription_medicines' 
    AND column_name = 'reminder_enabled'
  ) THEN
    ALTER TABLE public.prescription_medicines ADD COLUMN reminder_enabled BOOLEAN DEFAULT true;
    COMMENT ON COLUMN public.prescription_medicines.reminder_enabled IS 'Si se deben enviar recordatorios para este medicamento';
  END IF;
END $$;

-- ============================================================================
-- FASE 2.2: CREAR TABLA DE NOTIFICACIONES PENDIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  
  -- Referencias
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_dose_id UUID REFERENCES public.medication_doses(id) ON DELETE CASCADE,
  prescription_medicine_id UUID REFERENCES public.prescription_medicines(id) ON DELETE CASCADE,
  
  -- Datos del mensaje
  phone_number TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  scheduled_time TEXT NOT NULL, -- Formato "HH:MM"
  
  -- Control de envío
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder_5min', 'reminder_exact')),
  scheduled_at TIMESTAMPTZ NOT NULL, -- Cuándo debe enviarse
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  
  -- Reintentos
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- Twilio response
  twilio_message_sid TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  
  -- Constraint para evitar duplicados: mismo usuario, misma dosis, mismo tipo de notificación
  CONSTRAINT unique_notification UNIQUE (user_id, medication_dose_id, notification_type)
);

-- Índices para consultas eficientes del cron
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_pending 
  ON public.whatsapp_notifications (scheduled_at, status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_user_id 
  ON public.whatsapp_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_scheduled_at 
  ON public.whatsapp_notifications (scheduled_at);

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_whatsapp_notifications_updated_at
  BEFORE UPDATE ON public.whatsapp_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Comentarios
COMMENT ON TABLE public.whatsapp_notifications IS 'Cola de notificaciones WhatsApp pendientes para recordatorios de medicamentos';
COMMENT ON COLUMN public.whatsapp_notifications.notification_type IS 'reminder_5min = 5 minutos antes, reminder_exact = a la hora exacta';
COMMENT ON COLUMN public.whatsapp_notifications.scheduled_at IS 'Momento exacto en que debe enviarse la notificación (TIMESTAMPTZ)';

-- ============================================================================
-- FASE 2.3: CREAR TABLA DE LOGS DE NOTIFICACIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_notification_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  
  -- Referencia a la notificación original
  notification_id UUID REFERENCES public.whatsapp_notifications(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del mensaje
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'medication_reminder', 'welcome', etc.
  
  -- Respuesta de Twilio
  twilio_message_sid TEXT,
  twilio_status TEXT, -- 'queued', 'sent', 'delivered', 'failed', etc.
  twilio_error_code TEXT,
  twilio_error_message TEXT,
  
  -- Resultado
  success BOOLEAN NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id 
  ON public.whatsapp_notification_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at 
  ON public.whatsapp_notification_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_notification_id 
  ON public.whatsapp_notification_logs (notification_id);

-- Comentarios
COMMENT ON TABLE public.whatsapp_notification_logs IS 'Historial de todas las notificaciones WhatsApp enviadas (auditoría)';

-- ============================================================================
-- FASE 2.4: ROW LEVEL SECURITY
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_notifications
-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own whatsapp notifications"
  ON public.whatsapp_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Solo service_role puede insertar/actualizar (el cron/edge function)
CREATE POLICY "Service role can manage all whatsapp notifications"
  ON public.whatsapp_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para whatsapp_notification_logs
CREATE POLICY "Users can view their own whatsapp logs"
  ON public.whatsapp_notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all whatsapp logs"
  ON public.whatsapp_notification_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FASE 2.5: FUNCIÓN PARA GENERAR NOTIFICACIONES DESDE DOSIS
-- ============================================================================

-- Esta función se puede llamar cuando se crean nuevas dosis de medicamentos
-- para auto-generar las notificaciones correspondientes
CREATE OR REPLACE FUNCTION public.generate_medication_notifications(
  p_medication_dose_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dose RECORD;
  v_profile RECORD;
  v_medicine RECORD;
  v_5min_before TIMESTAMPTZ;
BEGIN
  -- Obtener información de la dosis
  SELECT md.*, pm.medicine_name, pm.dosage, pm.reminder_enabled, p.user_id as prescription_user_id
  INTO v_dose
  FROM medication_doses md
  JOIN prescription_medicines pm ON pm.id = md.prescription_medicine_id
  JOIN prescriptions p ON p.id = pm.prescription_id
  WHERE md.id = p_medication_dose_id;
  
  -- Si no existe o recordatorios deshabilitados, salir
  IF v_dose IS NULL OR NOT v_dose.reminder_enabled THEN
    RETURN;
  END IF;
  
  -- Obtener perfil del usuario
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_dose.user_id;
  
  -- Si WhatsApp no está habilitado o no hay teléfono, salir
  IF v_profile IS NULL OR NOT COALESCE(v_profile.whatsapp_enabled, false) OR v_profile.phone IS NULL THEN
    RETURN;
  END IF;
  
  -- Calcular 5 minutos antes
  v_5min_before := v_dose.scheduled_at - INTERVAL '5 minutes';
  
  -- Insertar notificación 5 minutos antes (si aún no pasó)
  IF v_5min_before > now() THEN
    INSERT INTO whatsapp_notifications (
      user_id, medication_dose_id, prescription_medicine_id,
      phone_number, patient_name, medicine_name, dosage,
      scheduled_time, notification_type, scheduled_at
    ) VALUES (
      v_dose.user_id, v_dose.id, v_dose.prescription_medicine_id,
      v_profile.phone,
      COALESCE(v_profile.first_name, 'Usuario'),
      v_dose.medicine_name,
      v_dose.dosage,
      TO_CHAR(v_dose.scheduled_at AT TIME ZONE COALESCE(v_profile.timezone, 'America/Mexico_City'), 'HH24:MI'),
      'reminder_5min',
      v_5min_before
    )
    ON CONFLICT (user_id, medication_dose_id, notification_type) DO NOTHING;
  END IF;
  
  -- Insertar notificación a la hora exacta (si aún no pasó)
  IF v_dose.scheduled_at > now() THEN
    INSERT INTO whatsapp_notifications (
      user_id, medication_dose_id, prescription_medicine_id,
      phone_number, patient_name, medicine_name, dosage,
      scheduled_time, notification_type, scheduled_at
    ) VALUES (
      v_dose.user_id, v_dose.id, v_dose.prescription_medicine_id,
      v_profile.phone,
      COALESCE(v_profile.first_name, 'Usuario'),
      v_dose.medicine_name,
      v_dose.dosage,
      TO_CHAR(v_dose.scheduled_at AT TIME ZONE COALESCE(v_profile.timezone, 'America/Mexico_City'), 'HH24:MI'),
      'reminder_exact',
      v_dose.scheduled_at
    )
    ON CONFLICT (user_id, medication_dose_id, notification_type) DO NOTHING;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.generate_medication_notifications IS 'Genera notificaciones WhatsApp pendientes para una dosis de medicamento';

-- ============================================================================
-- FASE 2.6: TRIGGER AUTOMÁTICO AL CREAR DOSIS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_generate_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo generar para nuevas dosis programadas en el futuro
  IF NEW.scheduled_at > now() AND NEW.status = 'scheduled' THEN
    PERFORM public.generate_medication_notifications(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger en medication_doses
DROP TRIGGER IF EXISTS auto_generate_notifications ON public.medication_doses;
CREATE TRIGGER auto_generate_notifications
  AFTER INSERT ON public.medication_doses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_notifications();

-- ============================================================================
-- FASE 2.7: FUNCIÓN PARA LIMPIAR NOTIFICACIONES ANTIGUAS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_whatsapp_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar notificaciones enviadas o fallidas hace más de 7 días
  DELETE FROM whatsapp_notifications
  WHERE status IN ('sent', 'failed', 'cancelled')
    AND updated_at < now() - INTERVAL '7 days';
    
  -- Eliminar logs de más de 30 días
  DELETE FROM whatsapp_notification_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_whatsapp_notifications IS 'Limpia notificaciones y logs antiguos para mantener la base de datos liviana';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.whatsapp_notifications TO service_role;
GRANT ALL ON TABLE public.whatsapp_notification_logs TO service_role;
GRANT SELECT ON TABLE public.whatsapp_notifications TO authenticated;
GRANT SELECT ON TABLE public.whatsapp_notification_logs TO authenticated;

GRANT EXECUTE ON FUNCTION public.generate_medication_notifications(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_whatsapp_notifications() TO service_role;
