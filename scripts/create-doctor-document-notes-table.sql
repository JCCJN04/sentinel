-- Create table for doctor notes on patient documents
CREATE TABLE IF NOT EXISTS doctor_document_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for better performance
  CONSTRAINT unique_doctor_document_note UNIQUE (doctor_id, document_id, created_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_document_notes_doctor ON doctor_document_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_document_notes_patient ON doctor_document_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_document_notes_document ON doctor_document_notes(document_id);
CREATE INDEX IF NOT EXISTS idx_doctor_document_notes_created ON doctor_document_notes(created_at DESC);

-- Enable RLS
ALTER TABLE doctor_document_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Doctors can view their own notes
CREATE POLICY "Doctors can view their own notes"
  ON doctor_document_notes
  FOR SELECT
  USING (
    doctor_id IN (
      SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Doctors can create notes
CREATE POLICY "Doctors can create notes"
  ON doctor_document_notes
  FOR INSERT
  WITH CHECK (
    doctor_id IN (
      SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Doctors can update their own notes
CREATE POLICY "Doctors can update their own notes"
  ON doctor_document_notes
  FOR UPDATE
  USING (
    doctor_id IN (
      SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Doctors can delete their own notes
CREATE POLICY "Doctors can delete their own notes"
  ON doctor_document_notes
  FOR DELETE
  USING (
    doctor_id IN (
      SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_doctor_document_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_document_notes_updated_at
  BEFORE UPDATE ON doctor_document_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_document_notes_updated_at();
