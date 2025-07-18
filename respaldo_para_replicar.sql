-- =================================================================
-- SCRIPT DE ESTRUCTURA FINAL (SOLO ESQUEMA PUBLIC)
-- =================================================================

-- FUNCIONES PERSONALIZADAS
CREATE FUNCTION public.add_document_history() RETURNS trigger
    LANGUAGE plpgsql
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

CREATE FUNCTION public.add_document_share_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO document_history (document_id, action, details, user_id)
  SELECT NEW.document_id, 'shared', 'Compartido con ' || NEW.shared_with, documents.user_id
  FROM documents
  WHERE documents.id = NEW.document_id;
  RETURN NULL;
END;
$$;

CREATE FUNCTION public.add_family_share_activity() RETURNS trigger
    LANGUAGE plpgsql
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

CREATE FUNCTION public.close_other_sessions(current_session_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE user_id = auth.uid() AND id != current_session_id;
END;
$$;

CREATE FUNCTION public.disable_document_history_trigger() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  ALTER TABLE documents DISABLE TRIGGER add_document_history_trigger;
END;
$$;

CREATE FUNCTION public.enable_document_history_trigger() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  ALTER TABLE documents ENABLE TRIGGER add_document_history_trigger;
END;
$$;

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.increment_share_access_count(share_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE document_shares
  SET access_count = access_count + 1
  WHERE id = share_id;
END;
$$;

CREATE FUNCTION public.log_activity(activity_type text, description text, ip_address text DEFAULT NULL::text, user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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

CREATE FUNCTION public.register_session(device text, location text DEFAULT NULL::text, ip_address text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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

CREATE FUNCTION public.run_sql(query text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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

CREATE FUNCTION public.run_sql_with_results(query text) RETURNS TABLE(rows jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY EXECUTE query;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error executing SQL: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

CREATE FUNCTION public.update_document_reminders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_document_shares_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- TABLAS
CREATE TABLE public.active_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    device text NOT NULL,
    location text,
    ip_address text,
    last_active timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.activity_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    activity_type text NOT NULL,
    description text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    parent_id uuid
);

CREATE TABLE public.document_annotations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    text text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.document_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    action text NOT NULL,
    details text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.document_reminders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    title text NOT NULL,
    date date NOT NULL,
    priority text DEFAULT 'media'::text,
    status text DEFAULT 'pendiente'::text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.document_shares (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    shared_with text NOT NULL,
    permissions jsonb DEFAULT '{"edit": false, "view": true, "print": false, "download": false}'::jsonb NOT NULL,
    share_method text DEFAULT 'link'::text NOT NULL,
    password text,
    expiry_date timestamp with time zone,
    access_count integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    recipients text[]
);

CREATE TABLE public.documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    date date NOT NULL,
    expiry_date date,
    provider text,
    amount text,
    currency text,
    status text DEFAULT 'vigente'::text NOT NULL,
    notes text,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_url text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    patient_name text,
    doctor_name text,
    specialty text
);

CREATE TABLE public.family_activity (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    family_member_id uuid NOT NULL,
    document_id uuid,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.family_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    member_email text NOT NULL,
    member_name text NOT NULL,
    relationship text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    permissions jsonb DEFAULT '{"edit": false, "download": false, "view_all": true, "categories": []}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.family_shared_documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    document_id uuid NOT NULL,
    family_member_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    avatar_url text,
    language text DEFAULT 'es'::text,
    timezone text DEFAULT 'America/Mexico_City'::text,
    date_format text DEFAULT 'DD/MM/YYYY'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text,
    notification_preferences jsonb DEFAULT '{"expiryAlerts": true, "securityAlerts": true, "paymentReminders": true, "smsNotifications": false, "documentReminders": true, "newsletterUpdates": false, "pushNotifications": true, "reminderFrequency": "weekly", "emailNotifications": true}'::jsonb,
    last_active timestamp with time zone DEFAULT now(),
    onboarding_complete boolean DEFAULT false
);

-- RESTRICCIONES Y LLAVES
ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.activity_history
    ADD CONSTRAINT activity_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.document_annotations
    ADD CONSTRAINT document_annotations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.document_reminders
    ADD CONSTRAINT document_reminders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.family_activity
    ADD CONSTRAINT family_activity_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.family_shared_documents
    ADD CONSTRAINT family_shared_documents_document_id_family_member_id_key UNIQUE (document_id, family_member_id);

ALTER TABLE ONLY public.family_shared_documents
    ADD CONSTRAINT family_shared_documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT unique_category_name_per_user UNIQUE (name, user_id);

-- ÍNDICES
CREATE INDEX document_reminders_date_idx ON public.document_reminders USING btree (date);
CREATE INDEX document_reminders_document_id_idx ON public.document_reminders USING btree (document_id);
CREATE INDEX document_reminders_status_idx ON public.document_reminders USING btree (status);
CREATE INDEX document_reminders_user_id_idx ON public.document_reminders USING btree (user_id);
CREATE INDEX document_shares_document_id_idx ON public.document_shares USING btree (document_id);
CREATE INDEX document_shares_owner_id_idx ON public.document_shares USING btree (owner_id);
CREATE INDEX document_shares_status_idx ON public.document_shares USING btree (status);
CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);
CREATE INDEX idx_categories_user_id_parent_id ON public.categories USING btree (user_id, parent_id);

-- TRIGGERS
CREATE TRIGGER add_document_history_trigger AFTER INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.add_document_history();
CREATE TRIGGER add_family_share_activity_trigger AFTER INSERT ON public.family_shared_documents FOR EACH ROW EXECUTE FUNCTION public.add_family_share_activity();
CREATE TRIGGER document_shares_updated_at BEFORE UPDATE ON public.document_shares FOR EACH ROW EXECUTE FUNCTION public.update_document_shares_updated_at();
CREATE TRIGGER on_categories_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_document_annotations_updated_at BEFORE UPDATE ON public.document_annotations FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_document_reminders_updated_at BEFORE UPDATE ON public.document_reminders FOR EACH ROW EXECUTE FUNCTION public.update_document_reminders_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- LLAVES FORÁNEAS
ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.activity_history
    ADD CONSTRAINT activity_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.document_annotations
    ADD CONSTRAINT document_annotations_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.document_annotations
    ADD CONSTRAINT document_annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.document_reminders
    ADD CONSTRAINT document_reminders_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.document_reminders
    ADD CONSTRAINT document_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.family_activity
    ADD CONSTRAINT family_activity_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.family_activity
    ADD CONSTRAINT family_activity_family_member_id_fkey FOREIGN KEY (family_member_id) REFERENCES public.family_members(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.family_activity
    ADD CONSTRAINT family_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.family_shared_documents
    ADD CONSTRAINT family_shared_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.family_shared_documents
    ADD CONSTRAINT family_shared_documents_family_member_id_fkey FOREIGN KEY (family_member_id) REFERENCES public.family_members(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.family_shared_documents
    ADD CONSTRAINT family_shared_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to create their own categories" ON public.categories FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Allow authenticated users to delete their own categories" ON public.categories FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Allow authenticated users to read global categories" ON public.categories FOR SELECT TO authenticated USING ((user_id IS NULL));
CREATE POLICY "Allow authenticated users to read their own categories" ON public.categories FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Allow authenticated users to update their own categories" ON public.categories FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Los usuarios pueden actualizar su propio perfil." ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Los usuarios pueden eliminar sus propias sesiones activas" ON public.active_sessions FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Los usuarios pueden leer su propio perfil." ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Los usuarios pueden ver su propio historial de actividad" ON public.activity_history FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Los usuarios pueden ver sus propias sesiones activas" ON public.active_sessions FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Permitir borrado a due├▒os y globales por usuarios autenticados" ON public.categories FOR DELETE USING (((auth.uid() = user_id) OR ((user_id IS NULL) AND (auth.role() = 'authenticated'::text))));
CREATE POLICY "Permitir_borrado_carpetas_propias_o_globales" ON public.categories FOR DELETE USING (((auth.uid() = user_id) OR ((user_id IS NULL) AND (auth.role() = 'authenticated'::text))));
CREATE POLICY "Users can delete annotations for documents they own" ON public.document_annotations FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_annotations.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete family shares for documents they own" ON public.family_shared_documents FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = family_shared_documents.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete history for documents they own" ON public.document_history FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_history.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete reminders for documents they own" ON public.document_reminders FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_reminders.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete reminders for their own documents" ON public.document_reminders FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_reminders.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete shares for documents they own" ON public.document_shares FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_shares.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete shares for their own documents" ON public.document_shares FOR DELETE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_shares.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own family members" ON public.family_members FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own reminders" ON public.document_reminders FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert annotations for their documents" ON public.document_annotations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_annotations.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can insert history for their documents" ON public.document_history FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert reminders for their documents" ON public.document_reminders FOR INSERT WITH CHECK ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_reminders.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can insert shares for their documents" ON public.document_shares FOR INSERT WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "Users can insert their own documents" ON public.documents FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own family activity" ON public.family_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own family members" ON public.family_members FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can insert their own reminders" ON public.document_reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own shared documents with family" ON public.family_shared_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update reminders for their documents" ON public.document_reminders FOR UPDATE USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_reminders.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can update their own annotations" ON public.document_annotations FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own family activity records" ON public.family_activity FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own family members" ON public.family_members FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));
CREATE POLICY "Users can update their own reminders" ON public.document_reminders FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can view annotations for their documents" ON public.document_annotations FOR SELECT USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_annotations.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can view history for their documents" ON public.document_history FOR SELECT USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_history.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can view reminders for their documents" ON public.document_reminders FOR SELECT USING ((EXISTS ( SELECT 1 FROM public.documents WHERE ((documents.id = document_reminders.document_id) AND (documents.user_id = auth.uid())))));
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own family activity" ON public.family_activity FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own family members" ON public.family_members FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Users can view their own reminders" ON public.document_reminders FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own shared documents with family" ON public.family_shared_documents FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "document_shares_delete_policy" ON public.document_shares FOR DELETE USING ((auth.uid() = owner_id));
CREATE POLICY "document_shares_insert_policy" ON public.document_shares FOR INSERT WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY "document_shares_select_policy" ON public.document_shares FOR SELECT USING ((auth.uid() = owner_id));
CREATE POLICY "document_shares_update_policy" ON public.document_shares FOR UPDATE USING ((auth.uid() = owner_id));