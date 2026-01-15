import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng';

async function diagnoseDoctorAccount() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Diagnosticando cuenta doctor@prueba.com...\n');
  
  try {
    // 1. Buscar el usuario en auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error al listar usuarios:', authError.message);
      return;
    }
    
    const doctorUser = authUsers.users.find(u => u.email === 'doctor@prueba.com');
    
    if (!doctorUser) {
      console.log('❌ No se encontró usuario con email doctor@prueba.com');
      console.log('\n📋 Usuarios disponibles:');
      authUsers.users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
      return;
    }
    
    console.log('✅ Usuario encontrado en auth.users:');
    console.log(`   Email: ${doctorUser.email}`);
    console.log(`   ID: ${doctorUser.id}`);
    console.log(`   Creado: ${doctorUser.created_at}\n`);
    
    // 2. Verificar si existe en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', doctorUser.id)
      .single();
    
    if (profileError) {
      console.log('❌ Error al buscar en profiles:', profileError.message);
      console.log('   Código:', profileError.code);
      
      if (profileError.code === 'PGRST116') {
        console.log('\n⚠️  El perfil no existe en la tabla profiles');
        console.log('💡 Necesitas crear un perfil. Ejecuta en SQL Editor:');
        console.log(`
INSERT INTO profiles (id, first_name, last_name, role)
VALUES ('${doctorUser.id}', 'Doctor', 'Prueba', 'doctor');
        `);
      }
      return;
    }
    
    console.log('✅ Perfil encontrado en profiles:');
    console.log(`   Nombre: ${profile.first_name} ${profile.last_name}`);
    console.log(`   Rol: ${profile.role || 'NO CONFIGURADO'}`);
    
    if (!profile.role || profile.role !== 'doctor') {
      console.log('\n⚠️  El rol no está configurado como "doctor"');
      console.log('💡 Ejecuta en SQL Editor:');
      console.log(`
UPDATE profiles 
SET role = 'doctor' 
WHERE id = '${doctorUser.id}';
      `);
    }
    
    // 3. Verificar si existe en doctor_profiles
    const { data: doctorProfile, error: doctorProfileError } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', doctorUser.id)
      .single();
    
    if (doctorProfileError) {
      console.log('\n❌ Error al buscar en doctor_profiles:', doctorProfileError.message);
      console.log('   Código:', doctorProfileError.code);
      
      if (doctorProfileError.code === 'PGRST116') {
        console.log('\n⚠️  No existe perfil de doctor en doctor_profiles');
        console.log('💡 Ejecuta en SQL Editor:');
        console.log(`
INSERT INTO doctor_profiles (user_id, specialty, license_number)
VALUES ('${doctorUser.id}', 'Medicina General', 'LIC-${doctorUser.id.substring(0, 8)}');
        `);
      }
    } else {
      console.log('\n✅ Perfil de doctor encontrado en doctor_profiles:');
      console.log(`   ID: ${doctorProfile.id}`);
      console.log(`   Especialidad: ${doctorProfile.specialty || 'No especificada'}`);
      console.log(`   Licencia: ${doctorProfile.license_number || 'No especificada'}`);
    }
    
    // 4. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(60));
    
    const hasAuth = !!doctorUser;
    const hasProfile = !!profile;
    const hasRole = profile?.role === 'doctor';
    const hasDoctorProfile = !!doctorProfile;
    
    console.log(`✅ Usuario en auth.users:        ${hasAuth ? 'SÍ' : 'NO'}`);
    console.log(`${hasProfile ? '✅' : '❌'} Perfil en profiles:           ${hasProfile ? 'SÍ' : 'NO'}`);
    console.log(`${hasRole ? '✅' : '❌'} Rol configurado como doctor:  ${hasRole ? 'SÍ' : 'NO'}`);
    console.log(`${hasDoctorProfile ? '✅' : '❌'} Perfil en doctor_profiles:    ${hasDoctorProfile ? 'SÍ' : 'NO'}`);
    
    if (hasAuth && hasProfile && hasRole && hasDoctorProfile) {
      console.log('\n🎉 ¡Todo está configurado correctamente!');
      console.log('   El problema puede ser de autenticación o caché.');
      console.log('   Intenta cerrar sesión y volver a iniciar.');
    } else {
      console.log('\n⚠️  Hay configuraciones faltantes.');
      console.log('   Revisa los comandos SQL arriba para completar la configuración.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

diagnoseDoctorAccount();
