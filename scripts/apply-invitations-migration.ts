import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyInvitationMigration() {
  console.log('📝 Aplicando migración de invitaciones...\n')
  
  // Create table
  console.log('1. Creando tabla doctor_patient_invitations...')
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
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
        UNIQUE(doctor_id, patient_email, status)
      );
    `
  })
  
  if (tableError && !tableError.message.includes('already exists')) {
    console.error('❌ Error creando tabla:', tableError)
  } else {
    console.log('✅ Tabla creada\n')
  }
  
  // Enable RLS
  console.log('2. Habilitando RLS...')
  await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.doctor_patient_invitations ENABLE ROW LEVEL SECURITY;'
  })
  console.log('✅ RLS habilitado\n')
  
  // Create indexes
  console.log('3. Creando índices...')
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_doctor_id ON public.doctor_patient_invitations(doctor_id);',
    'CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_patient_email ON public.doctor_patient_invitations(patient_email);',
    'CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_patient_id ON public.doctor_patient_invitations(patient_id);',
    'CREATE INDEX IF NOT EXISTS idx_doctor_patient_invitations_status ON public.doctor_patient_invitations(status);'
  ]
  
  for (const index of indexes) {
    await supabase.rpc('exec_sql', { sql: index })
  }
  console.log('✅ Índices creados\n')
  
  console.log('✅ ¡Migración completada exitosamente!')
}

applyInvitationMigration()
