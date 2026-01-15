-- =====================================================
-- MÓDULO DE DOCTORES - HealthPal
-- Migración para funcionalidad completa de doctores
-- (Actualizada para evitar errores en indices existentes)
-- =====================================================

-- =====================================================
-- 1. TABLA: doctor_profiles
-- Perfiles de doctores con información profesional
-- =====================================================
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información profesional
  professional_id TEXT, -- Cédula profesional
  specialty TEXT NOT NULL,
  subspecialties TEXT[],
  
  -- Información de contacto
  phone_number TEXT,
  office_address TEXT,
  consultation_hours JSONB, -- { "monday": ["09:00-13:00", "15:00-18:00"], ... }
  
  -- Información adicional
  bio TEXT,
  years_experience INTEGER,
  languages TEXT[] DEFAULT ARRAY['Español'],
  
  -- Configuración
  consultation_duration_minutes INTEGER DEFAULT 30,
  accepts_new_patients BOOLEAN DEFAULT true,
  consultation_fee DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_doctor UNIQUE(user_id)
);

COMMENT ON TABLE public.doctor_profiles IS 'Perfiles profesionales de los doctores registrados en el sistema';
COMMENT ON COLUMN public.doctor_profiles.professional_id IS 'Cédula profesional o número de registro médico';
COMMENT ON COLUMN public.doctor_profiles.consultation_hours IS 'Horarios de consulta en formato JSON por día de la semana';

-- =====================================================
-- 2. TABLA: doctor_patients
-- Relación entre doctores y pacientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.doctor_patients (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del paciente
  patient_notes TEXT, -- Notas privadas del doctor sobre el paciente
  
  -- Metadata
  first_consultation_date TIMESTAMPTZ,
  last_consultation_date TIMESTAMPTZ,
  total_consultations INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_doctor_patient UNIQUE(doctor_id, patient_id)
);

COMMENT ON TABLE public.doctor_patients IS 'Relación entre doctores y sus pacientes';

-- =====================================================
-- 3. TABLA: consultations
-- Consultas médicas programadas y realizadas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_patient_id UUID REFERENCES public.doctor_patients(id) ON DELETE SET NULL,
  
  -- Información de la consulta
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  
  reason TEXT NOT NULL, -- Motivo de la consulta
  symptoms TEXT, -- Síntomas reportados
  diagnosis TEXT, -- Diagnóstico del doctor
  treatment_plan TEXT, -- Plan de tratamiento
  notes TEXT, -- Notas adicionales
  
  -- Estado
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  cancellation_reason TEXT,
  
  -- Seguimiento
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.consultations IS 'Registro de consultas médicas entre doctores y pacientes';
COMMENT ON COLUMN public.consultations.status IS 'Estado de la consulta: scheduled, in_progress, completed, cancelled, no_show';

CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON public.consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- =====================================================
-- 4. TABLA: consultation_attachments
-- Imágenes y archivos adjuntos a consultas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consultation_attachments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- URL en Supabase Storage
  file_type TEXT, -- image/jpeg, application/pdf, etc.
  file_size INTEGER, -- Tamaño en bytes
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.consultation_attachments IS 'Archivos adjuntos a las consultas médicas';

CREATE INDEX IF NOT EXISTS idx_consultation_attachments_consultation_id ON public.consultation_attachments(consultation_id);

-- =====================================================
-- 5. TABLA: doctor_prescriptions
-- Recetas médicas emitidas por doctores
-- =====================================================
CREATE TABLE IF NOT EXISTS public.doctor_prescriptions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  
  -- Información del medicamento
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- "Cada 8 horas", "2 veces al día", etc.
  duration TEXT, -- "7 días", "2 semanas", etc.
  
  -- Fechas
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Instrucciones
  instructions TEXT,
  notes TEXT, -- Notas adicionales para el paciente
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.doctor_prescriptions IS 'Recetas médicas emitidas por doctores a sus pacientes';

CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_doctor_id ON public.doctor_prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_patient_id ON public.doctor_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_consultation_id ON public.doctor_prescriptions(consultation_id);

-- =====================================================
-- 6. TABLA: shared_documents_with_doctor
-- Documentos compartidos por pacientes con doctores
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shared_documents_with_doctor (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  
  -- Permisos
  can_view BOOLEAN DEFAULT true,
  can_download BOOLEAN DEFAULT false,
  
  -- Metadata
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  notes TEXT, -- Notas del paciente al compartir
  
  CONSTRAINT unique_document_doctor_share UNIQUE(document_id, doctor_id)
);

COMMENT ON TABLE public.shared_documents_with_doctor IS 'Documentos médicos compartidos entre pacientes y doctores';

CREATE INDEX IF NOT EXISTS idx_shared_documents_doctor_id ON public.shared_documents_with_doctor(doctor_id);
CREATE INDEX IF NOT EXISTS idx_shared_documents_patient_id ON public.shared_documents_with_doctor(patient_id);

-- =====================================================
-- 7. TABLA: doctor_availability
-- Disponibilidad específica de doctores (vacaciones, días ocupados)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  
  -- Horarios específicos del día
  time_slots JSONB, -- [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "18:00"}]
  
  reason TEXT, -- "Vacaciones", "Conferencia", etc.
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_doctor_date UNIQUE(doctor_id, date)
);

COMMENT ON TABLE public.doctor_availability IS 'Disponibilidad y horarios específicos de los doctores';

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_date ON public.doctor_availability(date);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_doctor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE OR REPLACE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_updated_at();

CREATE OR REPLACE TRIGGER update_doctor_patients_updated_at
  BEFORE UPDATE ON public.doctor_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_updated_at();

CREATE OR REPLACE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_updated_at();

CREATE OR REPLACE TRIGGER update_doctor_prescriptions_updated_at
  BEFORE UPDATE ON public.doctor_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_updated_at();

CREATE OR REPLACE TRIGGER update_doctor_availability_updated_at
  BEFORE UPDATE ON public.doctor_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_updated_at();

-- Función para actualizar estadísticas de doctor_patients
CREATE OR REPLACE FUNCTION update_doctor_patient_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.doctor_patients
    SET 
      total_consultations = total_consultations + 1,
      last_consultation_date = NEW.scheduled_at,
      first_consultation_date = COALESCE(first_consultation_date, NEW.scheduled_at)
    WHERE doctor_id = NEW.doctor_id 
      AND patient_id = NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_doctor_patient_stats_trigger
  AFTER INSERT ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_patient_stats();

-- Función para incrementar contador de vistas de documentos compartidos
CREATE OR REPLACE FUNCTION increment_shared_document_view()
RETURNS TRIGGER AS $$
BEGIN
  NEW.view_count = COALESCE(OLD.view_count, 0) + 1;
  NEW.last_viewed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents_with_doctor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: doctor_profiles
-- =====================================================

-- Los doctores pueden ver y actualizar su propio perfil
CREATE POLICY "Doctors can view their own profile"
  ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile"
  ON public.doctor_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own profile"
  ON public.doctor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Los pacientes pueden ver perfiles de doctores (info pública)
CREATE POLICY "Patients can view doctor profiles"
  ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- POLÍTICAS: doctor_patients
-- =====================================================

-- Los doctores pueden ver y gestionar sus pacientes
CREATE POLICY "Doctors can manage their patients"
  ON public.doctor_patients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_patients.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- Los pacientes pueden ver qué doctores tienen acceso a su info
CREATE POLICY "Patients can view their doctors"
  ON public.doctor_patients
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- =====================================================
-- POLÍTICAS: consultations
-- =====================================================

-- Los doctores pueden ver y gestionar sus consultas
CREATE POLICY "Doctors can manage their consultations"
  ON public.consultations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = consultations.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- Los pacientes pueden ver sus propias consultas
CREATE POLICY "Patients can view their consultations"
  ON public.consultations
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Los pacientes pueden crear consultas
CREATE POLICY "Patients can create consultations"
  ON public.consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- =====================================================
-- POLÍTICAS: consultation_attachments
-- =====================================================

-- Los doctores pueden ver adjuntos de sus consultas
CREATE POLICY "Doctors can view consultation attachments"
  ON public.consultation_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations
      JOIN public.doctor_profiles ON consultations.doctor_id = doctor_profiles.id
      WHERE consultations.id = consultation_attachments.consultation_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Los doctores pueden insertar adjuntos en sus consultas
CREATE POLICY "Doctors can insert consultation attachments"
  ON public.consultation_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultations
      JOIN public.doctor_profiles ON consultations.doctor_id = doctor_profiles.id
      WHERE consultations.id = consultation_attachments.consultation_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Los pacientes pueden ver adjuntos de sus consultas
CREATE POLICY "Patients can view their consultation attachments"
  ON public.consultation_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations
      WHERE consultations.id = consultation_attachments.consultation_id
        AND consultations.patient_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: doctor_prescriptions
-- =====================================================

-- Los doctores pueden gestionar sus recetas
CREATE POLICY "Doctors can manage their prescriptions"
  ON public.doctor_prescriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_prescriptions.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- Los pacientes pueden ver sus propias recetas
CREATE POLICY "Patients can view their prescriptions"
  ON public.doctor_prescriptions
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- =====================================================
-- POLÍTICAS: shared_documents_with_doctor
-- =====================================================

-- Los pacientes pueden compartir sus documentos con doctores
CREATE POLICY "Patients can share documents with doctors"
  ON public.shared_documents_with_doctor
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- Los pacientes pueden gestionar documentos que compartieron
CREATE POLICY "Patients can manage their shared documents"
  ON public.shared_documents_with_doctor
  FOR ALL
  TO authenticated
  USING (patient_id = auth.uid());

-- Los doctores pueden ver documentos compartidos con ellos
CREATE POLICY "Doctors can view documents shared with them"
  ON public.shared_documents_with_doctor
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = shared_documents_with_doctor.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- Los doctores pueden actualizar metadata (vistas, etc.)
CREATE POLICY "Doctors can update shared document metadata"
  ON public.shared_documents_with_doctor
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = shared_documents_with_doctor.doctor_id 
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = shared_documents_with_doctor.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: doctor_availability
-- =====================================================

-- Los doctores pueden gestionar su disponibilidad
CREATE POLICY "Doctors can manage their availability"
  ON public.doctor_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_availability.doctor_id 
        AND user_id = auth.uid()
    )
  );

-- Los usuarios autenticados pueden ver la disponibilidad
CREATE POLICY "Users can view doctor availability"
  ON public.doctor_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- FUNCIONES AUXILIARES PARA LA APLICACIÓN
-- =====================================================

-- Función para obtener el perfil de doctor del usuario actual
CREATE OR REPLACE FUNCTION get_current_doctor_profile()
RETURNS UUID AS $$
  SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función para verificar si un usuario es doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Función para verificar si un doctor tiene acceso a un paciente
CREATE OR REPLACE FUNCTION doctor_has_patient_access(
  p_doctor_id UUID,
  p_patient_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_patients
    WHERE doctor_id = p_doctor_id 
      AND patient_id = p_patient_id
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON public.doctor_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_doctor_id ON public.doctor_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_patient_id ON public.doctor_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_status ON public.doctor_patients(status);

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON SCHEMA public IS 'Módulo de doctores completamente funcional con gestión de pacientes, consultas, recetas y documentos compartidos';
