import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng';

async function updateUserRole() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 Actualizando rol de usuario doctor...\n');
  
  // Primero verificar si la columna role existe
  const { data: columns, error: schemaError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (columns && columns.length > 0) {
    console.log('📋 Columnas en profiles:', Object.keys(columns[0]));
    
    if ('role' in columns[0]) {
      console.log('✅ La columna role ya existe\n');
      
      // Actualizar el usuario
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'doctor' })
        .eq('id', '515f51d5-027f-4566-bb93-77f8ed6ba159')
        .select();
      
      if (error) {
        console.log('❌ Error:', error);
      } else {
        console.log('✅ Usuario actualizado:', data);
      }
    } else {
      console.log('❌ La columna role NO existe en profiles');
      console.log('\n📝 Para agregar la columna, ve al SQL Editor de Supabase y ejecuta:');
      console.log(`
ALTER TABLE profiles 
ADD COLUMN role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));

CREATE INDEX idx_profiles_role ON profiles(role);

UPDATE profiles 
SET role = 'doctor' 
WHERE id = '515f51d5-027f-4566-bb93-77f8ed6ba159';
      `);
    }
  }
}

updateUserRole();
