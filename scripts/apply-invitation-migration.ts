import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('📝 Aplicando migración de invitaciones doctor-paciente...\n')
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260113_doctor_patient_invitations.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  // Split by statement and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      if (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('❌ Error:', error.message)
        }
      }
    } catch (err: any) {
      console.error('❌ Error ejecutando statement:', err.message)
    }
  }
  
  console.log('\n✅ Migración completada')
}

applyMigration()
