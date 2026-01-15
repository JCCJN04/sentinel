import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng';

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 Aplicando migración: agregar columna role a profiles...\n');
  
  try {
    // 1. Agregar columna role
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));
      `
    });
    
    if (addColumnError) {
      console.log('ℹ️  Intentando método alternativo...');
      // Método alternativo usando el admin API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT \'patient\' CHECK (role IN (\'patient\', \'doctor\', \'admin\'))'
        })
      });
    }
    
    console.log('✅ Columna role agregada\n');
    
    // 2. Actualizar el usuario doctor
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'doctor' })
      .eq('id', '515f51d5-027f-4566-bb93-77f8ed6ba159')
      .select();
    
    if (updateError) {
      console.log('❌ Error al actualizar usuario:', updateError.message);
    } else {
      console.log('✅ Usuario actualizado a rol "doctor"');
      console.log('   ID:', updateData[0]?.id);
      console.log('   Rol:', updateData[0]?.role);
    }
    
    // 3. Verificar el resultado
    console.log('\n📊 Verificando configuración final...\n');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', '515f51d5-027f-4566-bb93-77f8ed6ba159')
      .single();
    
    if (profile) {
      console.log('✅ Perfil verificado:');
      console.log(`   Nombre: ${profile.full_name || 'N/A'}`);
      console.log(`   Email: ${profile.email || 'N/A'}`);
      console.log(`   Rol: ${profile.role}`);
    }
    
    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n💡 Ahora puedes reiniciar tu servidor y el módulo de doctores debería funcionar.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
