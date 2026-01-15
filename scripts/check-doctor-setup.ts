import { createClient } from '@supabase/supabase-js';

// Leer directamente las credenciales
const supabaseUrl = 'https://ouhyjucktnlvarnehcvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aHlqdWNrdG5sdmFybmVoY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMyNjcwOSwiZXhwIjoyMDgwOTAyNzA5fQ.vylJ5KnMG2QXEn4Qua_6YBZ1fEFdoy2OQh3DyJdUgng';

async function checkDoctorSetup() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Verificando configuración de Supabase...\n');
    console.log('URL:', supabaseUrl);
    console.log('Key prefix:', supabaseKey?.substring(0, 20) + '...\n');
    
    // 1. Verificar si la tabla doctor_profiles existe y tiene datos
    const { data: allDoctorProfiles, error: allDoctorsError } = await supabase
      .from('doctor_profiles')
      .select('*');
    
    if (allDoctorsError) {
      console.log('❌ Error al consultar doctor_profiles:', allDoctorsError.message);
      console.log('   Código:', allDoctorsError.code);
      console.log('   Esto puede significar que la tabla no existe o no tienes permisos\n');
    } else {
      console.log(`✅ Tabla doctor_profiles existe con ${allDoctorProfiles?.length || 0} registros\n`);
      
      if (allDoctorProfiles && allDoctorProfiles.length > 0) {
        console.log('📋 Perfiles de doctor encontrados:');
        allDoctorProfiles.forEach((doc, index) => {
          console.log(`   ${index + 1}. ID: ${doc.id}`);
          console.log(`      User ID: ${doc.user_id}`);
          console.log(`      Especialidad: ${doc.specialty || 'No especificada'}`);
          console.log(`      Licencia: ${doc.license_number || 'No especificada'}`);
        });
        console.log('');
      }
    }
    
    // 2. Verificar perfiles con rol de doctor
    const { data: doctorUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');
    
    if (usersError) {
      console.log('❌ Error al consultar profiles:', usersError.message);
    } else {
      console.log(`✅ Usuarios con rol "doctor": ${doctorUsers?.length || 0}\n`);
      
      if (doctorUsers && doctorUsers.length > 0) {
        console.log('👥 Usuarios doctor:');
        doctorUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.full_name || 'Sin nombre'} (${user.email || 'Sin email'})`);
          console.log(`      ID: ${user.id}`);
          console.log(`      Rol: ${user.role}`);
        });
        console.log('');
      }
    }
    
    // 3. Verificar doctor_patients
    const { data: doctorPatients, error: patientsError } = await supabase
      .from('doctor_patients')
      .select('*');
    
    if (patientsError) {
      console.log('❌ Error al consultar doctor_patients:', patientsError.message);
    } else {
      console.log(`✅ Relaciones doctor-paciente: ${doctorPatients?.length || 0}\n`);
    }
    
    // 4. Verificar consultas
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('*');
    
    if (consultationsError) {
      console.log('❌ Error al consultar consultations:', consultationsError.message);
    } else {
      console.log(`✅ Consultas en el sistema: ${consultations?.length || 0}\n`);
    }
    
    // 5. Diagnóstico final
    console.log('\n📊 DIAGNÓSTICO:');
    console.log('━'.repeat(50));
    
    if (doctorUsers && doctorUsers.length > 0 && (!allDoctorProfiles || allDoctorProfiles.length === 0)) {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log('   Tienes usuarios con rol "doctor" pero sin perfil en doctor_profiles');
      console.log('   Necesitas crear registros en la tabla doctor_profiles\n');
      console.log('💡 SOLUCIÓN:');
      console.log('   Para cada usuario doctor, ejecuta:');
      doctorUsers.forEach(user => {
        console.log(`   
   INSERT INTO doctor_profiles (user_id, specialty, license_number)
   VALUES ('${user.id}', 'Medicina General', 'LIC-${user.id.substring(0, 8)}');
        `);
      });
    } else if (allDoctorProfiles && allDoctorProfiles.length > 0) {
      console.log('✅ La configuración parece correcta');
      console.log('   Verifica que hayas iniciado sesión con el usuario correcto');
    } else {
      console.log('⚠️  No se encontraron doctores en el sistema');
      console.log('   1. Crea un usuario en Supabase Auth');
      console.log('   2. Actualiza su rol en profiles a "doctor"');
      console.log('   3. Crea su perfil en doctor_profiles');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkDoctorSetup();
