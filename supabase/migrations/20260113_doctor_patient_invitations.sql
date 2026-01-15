-- Migration: Add doctor patient invitations table
-- This table stores invitations from doctors to patients
-- Patients must accept before the relationship is created

CREATE TABLE IF NOT EXISTS public.doctor_patient_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_email TEXT NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  
  -- Prevent duplicate pending invitations
  UNIQUE(doctor_id, patient_email, status)
);

-- Enable RLS
ALTER TABLE public.doctor_patient_invitations ENABLE ROW LEVEL SECURITY;

-- Doctors can create and view their own invitations
CREATE POLICY "Doctors can create invitations"
  ON public.doctor_patient_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their invitations"
  ON public.doctor_patient_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

-- Patients can view invitations sent to their email
CREATE POLICY "Patients can view their invitations"
  ON public.doctor_patient_invitations
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR patient_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Patients can update invitations sent to them (accept/reject)
CREATE POLICY "Patients can respond to invitations"
  ON public.doctor_patient_invitations
  FOR UPDATE
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR patient_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id = auth.uid()
    OR patient_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_doctor_id 
  ON public.doctor_patient_invitations(doctor_id);
  
CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_patient_email 
  ON public.doctor_patient_invitations(patient_email);
  
CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_patient_id 
  ON public.doctor_patient_invitations(patient_id);
  
CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_status 
  ON public.doctor_patient_invitations(status);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.doctor_patient_invitations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update patient_id when they register
CREATE OR REPLACE FUNCTION link_invitation_to_patient()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.doctor_patient_invitations
  SET patient_id = NEW.id, updated_at = now()
  WHERE patient_email = NEW.email AND patient_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would need to be on auth.users which we can't access directly
-- Instead, we'll handle this in the application code when a patient logs in

COMMENT ON TABLE public.doctor_patient_invitations IS 'Stores invitations from doctors to patients requiring patient consent';
