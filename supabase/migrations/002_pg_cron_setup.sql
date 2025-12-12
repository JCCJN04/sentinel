-- ============================================================================
-- pg_cron: Programar el job de notificaciones WhatsApp
-- Fecha: 2024-12-11
-- 
-- PRERREQUISITOS:
--   1. Habilitar pg_cron en Supabase Dashboard > Database > Extensions
--   2. Habilitar pg_net en Supabase Dashboard > Database > Extensions
--   3. Desplegar la Edge Function 'send-medication-reminders'
--   4. Configurar secrets en Supabase Dashboard > Edge Functions > Secrets
-- ============================================================================

-- ============================================================================
-- PASO 1: Habilitar extensiones necesarias
-- ============================================================================

-- pg_cron permite programar jobs (ya debería estar habilitado en Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- pg_net permite hacer HTTP requests desde PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================================
-- PASO 2: Crear función que invoca la Edge Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.invoke_medication_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Obtener la URL de Supabase desde variables de entorno/secrets
  -- NOTA: Debes configurar estos valores en Supabase Vault o como constantes
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);
  
  -- Si no están configuradas las variables, usar valores por defecto
  -- (Deberás reemplazar esto con tu URL real)
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://TU_PROJECT_ID.supabase.co';
  END IF;
  
  -- Hacer HTTP POST a la Edge Function
  SELECT INTO v_request_id net.http_post(
    url := v_supabase_url || '/functions/v1/send-medication-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'timestamp', now()::text
    )
  );
  
  -- Log del request (opcional, para debugging)
  RAISE NOTICE 'Invoked Edge Function, request_id: %', v_request_id;
END;
$$;

COMMENT ON FUNCTION public.invoke_medication_reminders IS 'Invoca la Edge Function que procesa y envía los recordatorios de medicamentos por WhatsApp';

-- ============================================================================
-- PASO 3: Crear el cron job (cada minuto)
-- ============================================================================

-- Primero eliminar si ya existe
SELECT cron.unschedule('send-medication-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-medication-reminders'
);

-- Programar: cada minuto
-- Sintaxis cron: minuto hora día mes día_semana
-- '* * * * *' = cada minuto
SELECT cron.schedule(
  'send-medication-reminders',    -- nombre del job
  '* * * * *',                    -- cada minuto
  $$SELECT public.invoke_medication_reminders()$$
);

-- ============================================================================
-- PASO 4: Job de limpieza (una vez al día a las 3:00 AM)
-- ============================================================================

SELECT cron.unschedule('cleanup-whatsapp-notifications')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-whatsapp-notifications'
);

SELECT cron.schedule(
  'cleanup-whatsapp-notifications',
  '0 3 * * *',  -- 3:00 AM todos los días
  $$SELECT public.cleanup_old_whatsapp_notifications()$$
);

-- ============================================================================
-- ALTERNATIVA: Usar SQL directo sin Edge Function
-- (Más simple pero menos flexible)
-- ============================================================================

-- Si prefieres no usar Edge Functions, puedes crear una función PL/pgSQL
-- que use pg_net directamente para llamar a Twilio.
-- Sin embargo, esto es menos seguro porque las credenciales estarían en la DB.

CREATE OR REPLACE FUNCTION public.process_pending_notifications_direct()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification RECORD;
  v_twilio_url TEXT;
  v_twilio_auth TEXT;
  v_request_id BIGINT;
BEGIN
  -- Esta función es una ALTERNATIVA si no quieres usar Edge Functions
  -- Procesa directamente las notificaciones pendientes
  
  FOR v_notification IN 
    SELECT * FROM whatsapp_notifications
    WHERE status = 'pending'
      AND scheduled_at <= now()
      AND retry_count < max_retries
    ORDER BY scheduled_at
    LIMIT 10  -- Procesar en batches
    FOR UPDATE SKIP LOCKED  -- Evitar race conditions
  LOOP
    -- Marcar como procesando
    UPDATE whatsapp_notifications
    SET status = 'processing', updated_at = now()
    WHERE id = v_notification.id;
    
    -- Aquí llamarías a Twilio via pg_net
    -- NOTA: Requiere configurar las credenciales de Twilio como secrets
    
    -- Por seguridad, es mejor usar Edge Functions
    -- Esta es solo una demostración del patrón
    
  END LOOP;
END;
$$;

-- ============================================================================
-- QUERIES ÚTILES PARA MONITOREO
-- ============================================================================

-- Ver jobs programados
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones (últimas 50)
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Ver notificaciones pendientes para los próximos 10 minutos
-- SELECT * FROM whatsapp_notifications 
-- WHERE status = 'pending' 
--   AND scheduled_at BETWEEN now() AND now() + INTERVAL '10 minutes'
-- ORDER BY scheduled_at;

-- Ver estadísticas de hoy
-- SELECT 
--   status,
--   COUNT(*) as count
-- FROM whatsapp_notifications
-- WHERE created_at::date = CURRENT_DATE
-- GROUP BY status;
