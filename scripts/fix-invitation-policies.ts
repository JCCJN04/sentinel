import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixInvitationPolicies() {
  console.log('🔧 Arreglando políticas de invitaciones...\n')
  
  // Drop old policies
  console.log('1. Eliminando políticas antiguas...')
  const dropPolicies = [
    "DROP POLICY IF EXISTS \"Patients can view their invitations\" ON public.doctor_patient_invitations;",
    "DROP POLICY IF EXISTS \"Patients can respond to invitations\" ON public.doctor_patient_invitations;",
  ]
  
  for (const sql of dropPolicies) {
    const { error } = await supabase.rpc('run_sql', { sql })
    if (error && !error.message.includes('does not exist')) {
      console.error('Error:', error.message)
    }
  }
  console.log('✅ Políticas antiguas eliminadas\n')
  
  // Create new policies without auth.users reference
  console.log('2. Creando nuevas políticas...')
  
  // Patients can view invitations sent to them
  const viewPolicy = `
    CREATE POLICY "Patients can view their invitations"
    ON public.doctor_patient_invitations
    FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());
  `
  
  const { error: viewError } = await supabase.rpc('run_sql', { sql: viewPolicy })
  if (viewError) {
    console.error('❌ Error creando política de lectura:', viewError.message)
  } else {
    console.log('✅ Política de lectura creada')
  }
  
  // Patients can update invitations sent to them
  const updatePolicy = `
    CREATE POLICY "Patients can respond to invitations"
    ON public.doctor_patient_invitations
    FOR UPDATE
    TO authenticated
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());
  `
  
  const { error: updateError } = await supabase.rpc('run_sql', { sql: updatePolicy })
  if (updateError) {
    console.error('❌ Error creando política de actualización:', updateError.message)
  } else {
    console.log('✅ Política de actualización creada')
  }
  
  console.log('\n✅ Políticas actualizadas correctamente')
}

fixInvitationPolicies()
