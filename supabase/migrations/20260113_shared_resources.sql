-- Migration: Add shared resources with doctors
-- This table stores all types of resources shared with doctors (not just documents)

CREATE TYPE resource_type AS ENUM (
  'document',
  'prescription',
  'medication',
  'allergy',
  'vaccine',
  'antecedente',
  'report',
  'all_documents',
  'all_prescriptions',
  'all_medications',
  'all_allergies',
  'all_vaccines',
  'all_antecedentes',
  'all_reports'
);

CREATE TABLE IF NOT EXISTS public.shared_resources_with_doctor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  resource_id UUID, -- NULL for "all_*" types
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  notes TEXT,
  
  -- Prevent duplicate shares
  UNIQUE(patient_id, doctor_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.shared_resources_with_doctor ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own shares
CREATE POLICY "Patients can manage their shares"
  ON public.shared_resources_with_doctor
  FOR ALL
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Doctors can view shares with them
CREATE POLICY "Doctors can view shares with them"
  ON public.shared_resources_with_doctor
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_resources_patient_id 
  ON public.shared_resources_with_doctor(patient_id);
  
CREATE INDEX IF NOT EXISTS idx_shared_resources_doctor_id 
  ON public.shared_resources_with_doctor(doctor_id);
  
CREATE INDEX IF NOT EXISTS idx_shared_resources_type 
  ON public.shared_resources_with_doctor(resource_type);
  
CREATE INDEX IF NOT EXISTS idx_shared_resources_resource_id 
  ON public.shared_resources_with_doctor(resource_id);

-- Function to check if a doctor has access to a resource
CREATE OR REPLACE FUNCTION doctor_has_access_to_resource(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_resource_type resource_type,
  p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
  all_type TEXT;
BEGIN
  -- Check if doctor-patient relationship is active
  IF NOT EXISTS (
    SELECT 1 FROM public.doctor_patients
    WHERE doctor_id = p_doctor_id 
      AND patient_id = p_patient_id 
      AND status = 'active'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Determine the "all_*" equivalent type
  all_type := CASE p_resource_type
    WHEN 'document' THEN 'all_documents'
    WHEN 'prescription' THEN 'all_prescriptions'
    WHEN 'medication' THEN 'all_medications'
    WHEN 'allergy' THEN 'all_allergies'
    WHEN 'vaccine' THEN 'all_vaccines'
    WHEN 'antecedente' THEN 'all_antecedentes'
    WHEN 'report' THEN 'all_reports'
    ELSE NULL
  END;
  
  -- Check if specific resource is shared OR all resources of that type are shared
  SELECT EXISTS (
    SELECT 1 FROM public.shared_resources_with_doctor
    WHERE doctor_id = p_doctor_id
      AND patient_id = p_patient_id
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        -- Specific resource shared
        (resource_type = p_resource_type AND resource_id = p_resource_id)
        OR
        -- All resources of this type shared
        (resource_type::TEXT = all_type)
      )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared resource summary for a doctor
CREATE OR REPLACE FUNCTION get_shared_resources_summary(
  p_doctor_id UUID,
  p_patient_id UUID
)
RETURNS TABLE (
  resource_type TEXT,
  count BIGINT,
  has_all_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN srd.resource_type::TEXT LIKE 'all_%' THEN 
        REPLACE(srd.resource_type::TEXT, 'all_', '')
      ELSE 
        srd.resource_type::TEXT
    END as resource_type,
    COUNT(*) as count,
    BOOL_OR(srd.resource_type::TEXT LIKE 'all_%') as has_all_access
  FROM public.shared_resources_with_doctor srd
  WHERE srd.doctor_id = p_doctor_id
    AND srd.patient_id = p_patient_id
    AND (srd.expires_at IS NULL OR srd.expires_at > now())
  GROUP BY 
    CASE 
      WHEN srd.resource_type::TEXT LIKE 'all_%' THEN 
        REPLACE(srd.resource_type::TEXT, 'all_', '')
      ELSE 
        srd.resource_type::TEXT
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.shared_resources_with_doctor IS 'Stores all types of medical resources shared between patients and doctors';
