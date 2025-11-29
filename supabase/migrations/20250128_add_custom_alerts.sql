-- Crear tabla de alertas personalizadas
CREATE TABLE IF NOT EXISTS "public"."custom_alerts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'custom'::"text" NOT NULL,
    "priority" "text" DEFAULT 'media'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "trigger_date" timestamp with time zone,
    "expiry_date" timestamp with time zone,
    "recurrence" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "custom_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX "idx_custom_alerts_user_id" ON "public"."custom_alerts" USING "btree" ("user_id");
CREATE INDEX "idx_custom_alerts_status" ON "public"."custom_alerts" USING "btree" ("status");
CREATE INDEX "idx_custom_alerts_is_read" ON "public"."custom_alerts" USING "btree" ("is_read");
CREATE INDEX "idx_custom_alerts_trigger_date" ON "public"."custom_alerts" USING "btree" ("trigger_date");

-- Comentarios
COMMENT ON TABLE "public"."custom_alerts" IS 'Alertas personalizadas creadas por los usuarios o generadas automáticamente por el sistema.';
COMMENT ON COLUMN "public"."custom_alerts"."type" IS 'Tipo de alerta: custom, medication, vaccine, appointment, insurance, etc.';
COMMENT ON COLUMN "public"."custom_alerts"."priority" IS 'Prioridad: baja, media, alta, crítica';
COMMENT ON COLUMN "public"."custom_alerts"."recurrence" IS 'Configuración de recurrencia: {frequency: "daily"|"weekly"|"monthly", interval: number, end_date: string}';

-- Trigger para actualizar updated_at
CREATE OR REPLACE TRIGGER "update_custom_alerts_updated_at" 
    BEFORE UPDATE ON "public"."custom_alerts" 
    FOR EACH ROW 
    EXECUTE FUNCTION "public"."update_modified_column"();

-- Función para marcar alertas como leídas
CREATE OR REPLACE FUNCTION "public"."mark_alerts_as_read"("alert_ids" "uuid"[]) 
RETURNS "void"
LANGUAGE "plpgsql" 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE custom_alerts
  SET is_read = true, updated_at = now()
  WHERE id = ANY(alert_ids) AND user_id = auth.uid();
END;
$$;

-- Función para eliminar alertas antiguas (más de 90 días completadas)
CREATE OR REPLACE FUNCTION "public"."cleanup_old_alerts"() 
RETURNS "void"
LANGUAGE "plpgsql" 
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM custom_alerts
  WHERE status IN ('completada', 'cancelada') 
    AND updated_at < now() - interval '90 days';
    
  DELETE FROM document_reminders
  WHERE status IN ('completada', 'pospuesta') 
    AND updated_at < now() - interval '90 days';
END;
$$;

-- Función para generar alertas recurrentes
CREATE OR REPLACE FUNCTION "public"."generate_recurring_alerts"() 
RETURNS "void"
LANGUAGE "plpgsql" 
SECURITY DEFINER
AS $$
DECLARE
  alert_record RECORD;
  next_trigger_date timestamp with time zone;
BEGIN
  FOR alert_record IN 
    SELECT * FROM custom_alerts 
    WHERE recurrence IS NOT NULL 
      AND status = 'completada'
      AND (recurrence->>'end_date' IS NULL OR (recurrence->>'end_date')::timestamp > now())
  LOOP
    -- Calcular próxima fecha
    CASE alert_record.recurrence->>'frequency'
      WHEN 'daily' THEN
        next_trigger_date := alert_record.trigger_date + (alert_record.recurrence->>'interval')::int * interval '1 day';
      WHEN 'weekly' THEN
        next_trigger_date := alert_record.trigger_date + (alert_record.recurrence->>'interval')::int * interval '1 week';
      WHEN 'monthly' THEN
        next_trigger_date := alert_record.trigger_date + (alert_record.recurrence->>'interval')::int * interval '1 month';
      ELSE
        next_trigger_date := NULL;
    END CASE;
    
    -- Crear nueva alerta si la fecha es válida
    IF next_trigger_date IS NOT NULL AND next_trigger_date > now() THEN
      INSERT INTO custom_alerts (
        user_id, title, message, type, priority, trigger_date, 
        recurrence, metadata, link
      ) VALUES (
        alert_record.user_id,
        alert_record.title,
        alert_record.message,
        alert_record.type,
        alert_record.priority,
        next_trigger_date,
        alert_record.recurrence,
        alert_record.metadata,
        alert_record.link
      );
    END IF;
  END LOOP;
END;
$$;

-- Políticas RLS
ALTER TABLE "public"."custom_alerts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom alerts"
  ON "public"."custom_alerts" FOR SELECT
  USING ("auth"."uid"() = "user_id");

CREATE POLICY "Users can insert their own custom alerts"
  ON "public"."custom_alerts" FOR INSERT
  WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can update their own custom alerts"
  ON "public"."custom_alerts" FOR UPDATE
  USING ("auth"."uid"() = "user_id")
  WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can delete their own custom alerts"
  ON "public"."custom_alerts" FOR DELETE
  USING ("auth"."uid"() = "user_id");

-- Permisos
GRANT ALL ON TABLE "public"."custom_alerts" TO "anon";
GRANT ALL ON TABLE "public"."custom_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_alerts" TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."mark_alerts_as_read"("uuid"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."cleanup_old_alerts"() TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."generate_recurring_alerts"() TO "service_role";
