import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Verificando esquema de doctor_patients...\n')
  
  // Get sample data
  const { data, error } = await supabase
    .from('doctor_patients')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('📋 Columnas disponibles:', data && data.length > 0 ? Object.keys(data[0]) : 'No hay datos')
    console.log('\n📄 Datos de ejemplo:', JSON.stringify(data, null, 2))
  }
  
  // Check the profiles table too
  console.log('\n🔍 Verificando tabla profiles...\n')
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    console.error('❌ Error:', profileError)
  } else {
    console.log('📋 Columnas disponibles en profiles:', profileData && profileData.length > 0 ? Object.keys(profileData[0]) : 'No hay datos')
  }
}

checkSchema()
