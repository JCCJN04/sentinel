import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkForeignKeys() {
  console.log('🔍 Verificando claves foráneas...\n')
  
  // Query to get foreign keys for doctor_patients table
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'doctor_patients';
    `
  })
  
  if (error) {
    console.error('❌ Error:', error)
    console.log('\nIntentando método alternativo...\n')
    
    // Try a simple query to see what works
    const { data: testData, error: testError } = await supabase
      .from('doctor_patients')
      .select('*, profiles(*)')
      .limit(0)
    
    console.log('Test error:', testError)
  } else {
    console.log('📋 Claves foráneas:', JSON.stringify(data, null, 2))
  }
}

checkForeignKeys()
