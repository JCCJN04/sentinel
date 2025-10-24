

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."family_relationship_type" AS ENUM (
    'Madre',
    'Padre',
    'Hermano',
    'Hermana',
    'Abuelo materno',
    'Abuela materna',
    'Abuelo paterno',
    'Abuela paterna',
    'Tío materno',
    'Tía materna',
    'Tío paterno',
    'Tía paterna',
    'Primo',
    'Prima',
    'Hijo',
    'Hija',
    'Nieto',
    'Nieta',
    'Otro'
);


ALTER TYPE "public"."family_relationship_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_document_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_history (document_id, action, user_id)
    VALUES (NEW.id, 'created', NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO document_history (document_id, action, details, user_id)
    VALUES (NEW.id, 'edited', 'Documento actualizado', NEW.user_id);
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."add_document_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_document_share_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO document_history (document_id, action, details, user_id)
  SELECT NEW.document_id, 'shared', 'Compartido con ' || NEW.shared_with, documents.user_id
  FROM documents
  WHERE documents.id = NEW.document_id;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."add_document_share_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_family_share_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO family_activity (user_id, family_member_id, document_id, action, details)
  VALUES (
    NEW.user_id,
    NEW.family_member_id,
    NEW.document_id,
    'shared',
    'Documento compartido con miembro de familia'
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."add_family_share_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_other_sessions"("current_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE user_id = auth.uid() AND id != current_session_id;
END;
$$;


ALTER FUNCTION "public"."close_other_sessions"("current_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_document_history_trigger"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  ALTER TABLE documents DISABLE TRIGGER add_document_history_trigger;
END;
$$;


ALTER FUNCTION "public"."disable_document_history_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_document_history_trigger"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  ALTER TABLE documents ENABLE TRIGGER add_document_history_trigger;
END;
$$;


ALTER FUNCTION "public"."enable_document_history_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_id_for_upload"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN auth.uid()::TEXT;
END;
$$;


ALTER FUNCTION "public"."get_user_id_for_upload"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_share_access_count"("share_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE document_shares
  SET access_count = access_count + 1
  WHERE id = share_id;
END;
$$;


ALTER FUNCTION "public"."increment_share_access_count"("share_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_activity"("activity_type" "text", "description" "text", "ip_address" "text" DEFAULT NULL::"text", "user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_history (user_id, activity_type, description, ip_address, user_agent)
  VALUES (auth.uid(), activity_type, description, ip_address, user_agent)
  RETURNING id INTO activity_id;
  
  UPDATE profiles SET last_active = now() WHERE id = auth.uid();
  
  RETURN activity_id;
END;
$$;


ALTER FUNCTION "public"."log_activity"("activity_type" "text", "description" "text", "ip_address" "text", "user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_session"("device" "text", "location" "text" DEFAULT NULL::"text", "ip_address" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO active_sessions (user_id, device, location, ip_address)
  VALUES (auth.uid(), device, location, ip_address)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;


ALTER FUNCTION "public"."register_session"("device" "text", "location" "text", "ip_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_sql"("query" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE query;
  RETURN '{"success": true}'::JSONB;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;


ALTER FUNCTION "public"."run_sql"("query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_sql_with_results"("query" "text") RETURNS TABLE("rows" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY EXECUTE query;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error executing SQL: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."run_sql_with_results"("query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_reminders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_reminders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_shares_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_shares_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "device" "text" NOT NULL,
    "location" "text",
    "ip_address" "text",
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."active_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."allergies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."allergies" OWNER TO "postgres";


COMMENT ON TABLE "public"."allergies" IS 'Catálogo maestro de posibles alergias.';



COMMENT ON COLUMN "public"."allergies"."type" IS 'Clasificación de la alergia (ej: Medicamento, Alimento, Ambiental).';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "parent_id" "uuid"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_annotations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "details" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_reminders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "priority" "text" DEFAULT 'media'::"text",
    "status" "text" DEFAULT 'pendiente'::"text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{"edit": false, "view": true, "print": false, "download": false}'::"jsonb" NOT NULL,
    "share_method" "text" DEFAULT 'link'::"text" NOT NULL,
    "password" "text",
    "expiry_date" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "recipients" "text"[]
);


ALTER TABLE "public"."document_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "date" "date" NOT NULL,
    "expiry_date" "date",
    "provider" "text",
    "amount" "text",
    "currency" "text",
    "status" "text" DEFAULT 'vigente'::"text" NOT NULL,
    "notes" "text",
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_url" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "patient_name" "text",
    "doctor_name" "text",
    "specialty" "text"
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_activity" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "family_member_id" "uuid" NOT NULL,
    "document_id" "uuid",
    "action" "text" NOT NULL,
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."family_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "member_email" "text" NOT NULL,
    "member_name" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{"edit": false, "download": false, "view_all": true, "categories": []}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."family_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_shared_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "family_member_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."family_shared_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_conditions_catalog" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."medical_conditions_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication_dictionary" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "spanish_name" "text" NOT NULL,
    "generic_name_en" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."medication_dictionary" OWNER TO "postgres";


COMMENT ON TABLE "public"."medication_dictionary" IS 'Mapea nombres de medicamentos comunes en español a sus nombres genéricos en inglés.';



CREATE TABLE IF NOT EXISTS "public"."medication_doses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prescription_medicine_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "taken_at" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medication_doses" OWNER TO "postgres";


COMMENT ON TABLE "public"."medication_doses" IS 'Rastrea cada dosis individual de un medicamento, su horario y estado.';



CREATE TABLE IF NOT EXISTS "public"."prescription_medicines" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "medicine_name" "text" NOT NULL,
    "dosage" "text",
    "duration" integer,
    "instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "frequency_hours" integer
);


ALTER TABLE "public"."prescription_medicines" OWNER TO "postgres";


COMMENT ON COLUMN "public"."prescription_medicines"."frequency_hours" IS 'Frecuencia de la toma en horas (ej: 8, 12, 24).';



CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "doctor_name" "text",
    "diagnosis" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "notes" "text",
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "language" "text" DEFAULT 'es'::"text",
    "timezone" "text" DEFAULT 'America/Mexico_City'::"text",
    "date_format" "text" DEFAULT 'DD/MM/YYYY'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "notification_preferences" "jsonb" DEFAULT '{"expiryAlerts": true, "securityAlerts": true, "paymentReminders": true, "smsNotifications": false, "documentReminders": true, "newsletterUpdates": false, "pushNotifications": true, "reminderFrequency": "weekly", "emailNotifications": true}'::"jsonb",
    "last_active" timestamp with time zone DEFAULT "now"(),
    "onboarding_complete" boolean DEFAULT false,
    "curp" "text",
    "genero" "text",
    "tipo_de_sangre" "text",
    "fotografia_url" "text",
    "estado_civil" "text",
    "ocupacion" "text",
    "contacto_emergencia" "jsonb",
    "direccion" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "file_type" "text",
    "storage_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recipe_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "can_download" boolean DEFAULT true NOT NULL,
    "access_token" "text"
);


ALTER TABLE "public"."shared_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_allergies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "allergy_name" "text" NOT NULL,
    "reaction_description" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "severity" "text" DEFAULT 'moderada'::"text",
    "reaction_type" "text",
    "date_diagnosed" "date",
    "treatment" "text",
    "instructions" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_allergies" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_allergies" IS 'Almacena las alergias reportadas por cada usuario.';



COMMENT ON COLUMN "public"."user_allergies"."user_id" IS 'Referencia al usuario en la tabla de autenticación.';



COMMENT ON COLUMN "public"."user_allergies"."allergy_name" IS 'Nombre del alérgeno (ej: Penicilina, Cacahuates).';



COMMENT ON COLUMN "public"."user_allergies"."reaction_description" IS 'Descripción de la reacción que experimenta el usuario.';



COMMENT ON COLUMN "public"."user_allergies"."notes" IS 'Notas adicionales o precauciones.';



CREATE TABLE IF NOT EXISTS "public"."user_family_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "condition_name" "text" NOT NULL,
    "family_member" "public"."family_relationship_type" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_family_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_family_history" IS 'Registra las enfermedades o condiciones patológicas de los familiares del usuario.';



CREATE TABLE IF NOT EXISTS "public"."user_personal_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "condition_name" "text" NOT NULL,
    "diagnosis_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_personal_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_personal_history" IS 'Registra las enfermedades o condiciones patológicas personales del usuario.';



CREATE TABLE IF NOT EXISTS "public"."vaccinations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vaccine_name" "text" NOT NULL,
    "disease_protected" "text",
    "dose_details" "text",
    "administration_date" "date" NOT NULL,
    "lot_number" "text",
    "application_site" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vaccinations" OWNER TO "postgres";


COMMENT ON TABLE "public"."vaccinations" IS 'Almacena los registros de vacunación de los usuarios.';



COMMENT ON COLUMN "public"."vaccinations"."lot_number" IS 'Número de lote del vial de la vacuna.';



CREATE TABLE IF NOT EXISTS "public"."vaccine_catalog" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "disease_protected" "text" NOT NULL,
    "target_population" "text",
    "notes" "text"
);


ALTER TABLE "public"."vaccine_catalog" OWNER TO "postgres";


COMMENT ON TABLE "public"."vaccine_catalog" IS 'Catálogo de vacunas comunes para estandarizar datos.';



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_history"
    ADD CONSTRAINT "activity_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."allergies"
    ADD CONSTRAINT "allergies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."allergies"
    ADD CONSTRAINT "allergies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_history"
    ADD CONSTRAINT "document_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_reminders"
    ADD CONSTRAINT "document_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_shares"
    ADD CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_activity"
    ADD CONSTRAINT "family_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_shared_documents"
    ADD CONSTRAINT "family_shared_documents_document_id_family_member_id_key" UNIQUE ("document_id", "family_member_id");



ALTER TABLE ONLY "public"."family_shared_documents"
    ADD CONSTRAINT "family_shared_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_conditions_catalog"
    ADD CONSTRAINT "medical_conditions_catalog_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."medical_conditions_catalog"
    ADD CONSTRAINT "medical_conditions_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_dictionary"
    ADD CONSTRAINT "medication_dictionary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_dictionary"
    ADD CONSTRAINT "medication_dictionary_spanish_name_key" UNIQUE ("spanish_name");



ALTER TABLE ONLY "public"."medication_doses"
    ADD CONSTRAINT "medication_doses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_medicines"
    ADD CONSTRAINT "prescription_medicines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_uploads"
    ADD CONSTRAINT "recipe_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_links"
    ADD CONSTRAINT "shared_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "unique_category_name_per_user" UNIQUE ("name", "user_id");



ALTER TABLE ONLY "public"."user_allergies"
    ADD CONSTRAINT "user_allergies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_family_history"
    ADD CONSTRAINT "user_family_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_personal_history"
    ADD CONSTRAINT "user_personal_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vaccine_catalog"
    ADD CONSTRAINT "vaccine_catalog_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vaccine_catalog"
    ADD CONSTRAINT "vaccine_catalog_pkey" PRIMARY KEY ("id");



CREATE INDEX "document_reminders_date_idx" ON "public"."document_reminders" USING "btree" ("date");



CREATE INDEX "document_reminders_document_id_idx" ON "public"."document_reminders" USING "btree" ("document_id");



CREATE INDEX "document_reminders_status_idx" ON "public"."document_reminders" USING "btree" ("status");



CREATE INDEX "document_reminders_user_id_idx" ON "public"."document_reminders" USING "btree" ("user_id");



CREATE INDEX "document_shares_document_id_idx" ON "public"."document_shares" USING "btree" ("document_id");



CREATE INDEX "document_shares_owner_id_idx" ON "public"."document_shares" USING "btree" ("owner_id");



CREATE INDEX "document_shares_status_idx" ON "public"."document_shares" USING "btree" ("status");



CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_user_id_parent_id" ON "public"."categories" USING "btree" ("user_id", "parent_id");



CREATE INDEX "idx_medication_doses_scheduled_at" ON "public"."medication_doses" USING "btree" ("scheduled_at");



CREATE INDEX "idx_medication_doses_user_id_status" ON "public"."medication_doses" USING "btree" ("user_id", "status");



CREATE INDEX "idx_recipe_uploads_prescription_id" ON "public"."recipe_uploads" USING "btree" ("prescription_id");



CREATE INDEX "idx_recipe_uploads_user_id" ON "public"."recipe_uploads" USING "btree" ("user_id");



CREATE INDEX "idx_shared_links_access_token" ON "public"."shared_links" USING "btree" ("access_token");



CREATE OR REPLACE TRIGGER "add_document_history_trigger" AFTER INSERT OR UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."add_document_history"();



CREATE OR REPLACE TRIGGER "add_family_share_activity_trigger" AFTER INSERT ON "public"."family_shared_documents" FOR EACH ROW EXECUTE FUNCTION "public"."add_family_share_activity"();



CREATE OR REPLACE TRIGGER "document_shares_updated_at" BEFORE UPDATE ON "public"."document_shares" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_shares_updated_at"();



CREATE OR REPLACE TRIGGER "on_categories_update" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_document_annotations_updated_at" BEFORE UPDATE ON "public"."document_annotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_document_reminders_updated_at" BEFORE UPDATE ON "public"."document_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_reminders_updated_at"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_family_members_updated_at" BEFORE UPDATE ON "public"."family_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_medication_doses_updated_at" BEFORE UPDATE ON "public"."medication_doses" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_prescription_medicines_updated_at" BEFORE UPDATE ON "public"."prescription_medicines" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_prescriptions_updated_at" BEFORE UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_recipe_uploads_updated_at" BEFORE UPDATE ON "public"."recipe_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_user_allergies_updated_at" BEFORE UPDATE ON "public"."user_allergies" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_history"
    ADD CONSTRAINT "activity_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_history"
    ADD CONSTRAINT "document_history_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_history"
    ADD CONSTRAINT "document_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_reminders"
    ADD CONSTRAINT "document_reminders_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_reminders"
    ADD CONSTRAINT "document_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_shares"
    ADD CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_shares"
    ADD CONSTRAINT "document_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."family_activity"
    ADD CONSTRAINT "family_activity_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_activity"
    ADD CONSTRAINT "family_activity_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_activity"
    ADD CONSTRAINT "family_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."family_shared_documents"
    ADD CONSTRAINT "family_shared_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_shared_documents"
    ADD CONSTRAINT "family_shared_documents_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_shared_documents"
    ADD CONSTRAINT "family_shared_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."medication_doses"
    ADD CONSTRAINT "medication_doses_prescription_medicine_id_fkey" FOREIGN KEY ("prescription_medicine_id") REFERENCES "public"."prescription_medicines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_doses"
    ADD CONSTRAINT "medication_doses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_medicines"
    ADD CONSTRAINT "prescription_medicines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_uploads"
    ADD CONSTRAINT "recipe_uploads_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_uploads"
    ADD CONSTRAINT "recipe_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_links"
    ADD CONSTRAINT "shared_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_links"
    ADD CONSTRAINT "shared_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_allergies"
    ADD CONSTRAINT "user_allergies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_family_history"
    ADD CONSTRAINT "user_family_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_personal_history"
    ADD CONSTRAINT "user_personal_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to create their own categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to delete their own categories" ON "public"."categories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to read global categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("user_id" IS NULL));



CREATE POLICY "Allow authenticated users to read their own categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to update their own categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow read access to all authenticated users" ON "public"."medical_conditions_catalog" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read access to all authenticated users" ON "public"."vaccine_catalog" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read access to authenticated users" ON "public"."medication_dictionary" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable all access for user based on user_id" ON "public"."shared_links" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable all operations for own family history" ON "public"."user_family_history" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable all operations for own personal history" ON "public"."user_personal_history" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable all operations for own vaccination records" ON "public"."vaccinations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for own allergies" ON "public"."user_allergies" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for own allergies" ON "public"."user_allergies" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable public read access" ON "public"."shared_links" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."allergies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for own allergies" ON "public"."user_allergies" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Los usuarios pueden eliminar sus propias sesiones activas" ON "public"."active_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Los usuarios pueden leer su propio perfil." ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Los usuarios pueden ver su propio historial de actividad" ON "public"."activity_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Los usuarios pueden ver sus propias sesiones activas" ON "public"."active_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Permitir borrado a due├▒os y globales por usuarios autentic" ON "public"."categories" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (("user_id" IS NULL) AND ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Permitir_borrado_carpetas_propias_o_globales" ON "public"."categories" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (("user_id" IS NULL) AND ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Users can delete annotations for documents they own" ON "public"."document_annotations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_annotations"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete family shares for documents they own" ON "public"."family_shared_documents" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "family_shared_documents"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete history for documents they own" ON "public"."document_history" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_history"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete reminders for documents they own" ON "public"."document_reminders" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_reminders"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete reminders for their own documents" ON "public"."document_reminders" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_reminders"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete shares for documents they own" ON "public"."document_shares" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_shares"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete shares for their own documents" ON "public"."document_shares" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_shares"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own documents" ON "public"."documents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own family members" ON "public"."family_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own prescriptions." ON "public"."prescriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own recipe uploads" ON "public"."recipe_uploads" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own reminders" ON "public"."document_reminders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert annotations for their documents" ON "public"."document_annotations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_annotations"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert history for their documents" ON "public"."document_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert reminders for their documents" ON "public"."document_reminders" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_reminders"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert shares for their documents" ON "public"."document_shares" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own family activity" ON "public"."family_activity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own family members" ON "public"."family_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own prescriptions." ON "public"."prescriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own recipe uploads" ON "public"."recipe_uploads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own reminders" ON "public"."document_reminders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own shared documents with family" ON "public"."family_shared_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage medicines for their own prescriptions." ON "public"."prescription_medicines" USING ((( SELECT "prescriptions"."user_id"
   FROM "public"."prescriptions"
  WHERE ("prescriptions"."id" = "prescription_medicines"."prescription_id")) = "auth"."uid"()));



CREATE POLICY "Users can manage their own medication doses" ON "public"."medication_doses" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update reminders for their documents" ON "public"."document_reminders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_reminders"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own annotations" ON "public"."document_annotations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own documents" ON "public"."documents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own family activity records" ON "public"."family_activity" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own family members" ON "public"."family_members" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own prescriptions." ON "public"."prescriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own reminders" ON "public"."document_reminders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view annotations for their documents" ON "public"."document_annotations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_annotations"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view history for their documents" ON "public"."document_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_history"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view reminders for their documents" ON "public"."document_reminders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."documents"
  WHERE (("documents"."id" = "document_reminders"."document_id") AND ("documents"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own documents" ON "public"."documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own family activity" ON "public"."family_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own family members" ON "public"."family_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own prescriptions." ON "public"."prescriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own recipe uploads" ON "public"."recipe_uploads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reminders" ON "public"."document_reminders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own shared documents with family" ON "public"."family_shared_documents" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."active_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."allergies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_shares_delete_policy" ON "public"."document_shares" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_shares_insert_policy" ON "public"."document_shares" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_shares_select_policy" ON "public"."document_shares" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "document_shares_update_policy" ON "public"."document_shares" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_shared_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_conditions_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_dictionary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_doses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription_medicines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipe_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_allergies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_family_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_personal_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vaccinations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vaccine_catalog" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_document_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_document_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_document_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_document_share_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_document_share_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_document_share_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_family_share_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_family_share_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_family_share_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."close_other_sessions"("current_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."close_other_sessions"("current_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_other_sessions"("current_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_document_history_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."disable_document_history_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_document_history_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_document_history_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."enable_document_history_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_document_history_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_for_upload"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_for_upload"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_for_upload"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_share_access_count"("share_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_share_access_count"("share_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_share_access_count"("share_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_activity"("activity_type" "text", "description" "text", "ip_address" "text", "user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_activity"("activity_type" "text", "description" "text", "ip_address" "text", "user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_activity"("activity_type" "text", "description" "text", "ip_address" "text", "user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_session"("device" "text", "location" "text", "ip_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."register_session"("device" "text", "location" "text", "ip_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_session"("device" "text", "location" "text", "ip_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_sql_with_results"("query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_sql_with_results"("query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_sql_with_results"("query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_reminders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_reminders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_reminders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_shares_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_shares_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_shares_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."activity_history" TO "anon";
GRANT ALL ON TABLE "public"."activity_history" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_history" TO "service_role";



GRANT ALL ON TABLE "public"."allergies" TO "anon";
GRANT ALL ON TABLE "public"."allergies" TO "authenticated";
GRANT ALL ON TABLE "public"."allergies" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."document_annotations" TO "anon";
GRANT ALL ON TABLE "public"."document_annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."document_annotations" TO "service_role";



GRANT ALL ON TABLE "public"."document_history" TO "anon";
GRANT ALL ON TABLE "public"."document_history" TO "authenticated";
GRANT ALL ON TABLE "public"."document_history" TO "service_role";



GRANT ALL ON TABLE "public"."document_reminders" TO "anon";
GRANT ALL ON TABLE "public"."document_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."document_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."document_shares" TO "anon";
GRANT ALL ON TABLE "public"."document_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."document_shares" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."family_activity" TO "anon";
GRANT ALL ON TABLE "public"."family_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."family_activity" TO "service_role";



GRANT ALL ON TABLE "public"."family_members" TO "anon";
GRANT ALL ON TABLE "public"."family_members" TO "authenticated";
GRANT ALL ON TABLE "public"."family_members" TO "service_role";



GRANT ALL ON TABLE "public"."family_shared_documents" TO "anon";
GRANT ALL ON TABLE "public"."family_shared_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."family_shared_documents" TO "service_role";



GRANT ALL ON TABLE "public"."medical_conditions_catalog" TO "anon";
GRANT ALL ON TABLE "public"."medical_conditions_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_conditions_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."medication_dictionary" TO "anon";
GRANT ALL ON TABLE "public"."medication_dictionary" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_dictionary" TO "service_role";



GRANT ALL ON TABLE "public"."medication_doses" TO "anon";
GRANT ALL ON TABLE "public"."medication_doses" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_doses" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_medicines" TO "anon";
GRANT ALL ON TABLE "public"."prescription_medicines" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_medicines" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_uploads" TO "anon";
GRANT ALL ON TABLE "public"."recipe_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."shared_links" TO "anon";
GRANT ALL ON TABLE "public"."shared_links" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_links" TO "service_role";



GRANT ALL ON TABLE "public"."user_allergies" TO "anon";
GRANT ALL ON TABLE "public"."user_allergies" TO "authenticated";
GRANT ALL ON TABLE "public"."user_allergies" TO "service_role";



GRANT ALL ON TABLE "public"."user_family_history" TO "anon";
GRANT ALL ON TABLE "public"."user_family_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_family_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_personal_history" TO "anon";
GRANT ALL ON TABLE "public"."user_personal_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_personal_history" TO "service_role";



GRANT ALL ON TABLE "public"."vaccinations" TO "anon";
GRANT ALL ON TABLE "public"."vaccinations" TO "authenticated";
GRANT ALL ON TABLE "public"."vaccinations" TO "service_role";



GRANT ALL ON TABLE "public"."vaccine_catalog" TO "anon";
GRANT ALL ON TABLE "public"."vaccine_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."vaccine_catalog" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
