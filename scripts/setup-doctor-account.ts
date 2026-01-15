import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng';

async function setupDoctorAccount() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const doctorUserId = '515f51d5-027f-4566-bb93-77f8ed6ba159';
  
  console.log('🔧 Configurando cuenta completa para doctor@prueba.com...\n');
  
  try {
    // 1. Crear perfil en profiles
    console.log('📝 Paso 1: Creando perfil en profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: doctorUserId,
        first_name: 'Doctor',
        last_name: 'Prueba',
        role: 'doctor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Error al crear perfil:', profileError.message);
      console.log('   Detalles:', profileError);
    } else {
      console.log('✅ Perfil creado/actualizado en profiles');
      console.log(`   Nombre: ${profile.first_name} ${profile.last_name}`);
      console.log(`   Rol: ${profile.role}\n`);
    }
    
    // 2. Crear/verificar perfil de doctor en doctor_profiles
    console.log('📝 Paso 2: Creando perfil en doctor_profiles...');
    
    // Primero verificar si ya existe
    const { data: existingDoctor } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', doctorUserId)
      .single();
    
    if (existingDoctor) {
      console.log('✅ Ya existe perfil de doctor en doctor_profiles');
      console.log(`   ID: ${existingDoctor.id}`);
      console.log(`   Especialidad: ${existingDoctor.specialty || 'No especificada'}\n`);
    } else {
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctor_profiles')
        .insert({
          user_id: doctorUserId,
          specialty: 'Medicina General',
          license_number: `LIC-${doctorUserId.substring(0, 8)}`,
          accepts_new_patients: true,
        })
        .select()
        .single();
      
      if (doctorError) {
        console.log('❌ Error al crear perfil de doctor:', doctorError.message);
        console.log('   Detalles:', doctorError);
      } else {
        console.log('✅ Perfil de doctor creado en doctor_profiles');
        console.log(`   ID: ${doctorProfile.id}`);
        console.log(`   Especialidad: ${doctorProfile.specialty}\n`);
      }
    }
    
    // 3. Verificación final
    console.log('📊 Verificación final...\n');
    
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('id', doctorUserId)
      .single();
    
    const { data: finalDoctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id, user_id, specialty, license_number')
      .eq('user_id', doctorUserId)
      .single();
    
    if (finalProfile && finalDoctorProfile) {
      console.log('🎉 ¡Configuración completada exitosamente!');
      console.log('\n📋 Detalles de la cuenta:');
      console.log('   ━'.repeat(30));
      console.log(`   Email: doctor@prueba.com`);
      console.log(`   Nombre: ${finalProfile.first_name} ${finalProfile.last_name}`);
      console.log(`   Rol: ${finalProfile.role}`);
      console.log(`   Especialidad: ${finalDoctorProfile.specialty}`);
      console.log(`   Licencia: ${finalDoctorProfile.license_number}`);
      console.log('\n💡 Ahora puedes:');
      console.log('   1. Reiniciar el servidor (npm run dev)');
      console.log('   2. Iniciar sesión con doctor@prueba.com');
      console.log('   3. Acceder a /doctor');
    } else {
      console.log('⚠️  Algo salió mal. Revisa los errores arriba.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupDoctorAccount();
