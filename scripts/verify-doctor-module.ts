/**
 * Script de verificación simplificado del módulo de doctores
 * Verifica que las tablas y estructuras estén creadas correctamente
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Leer .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró el archivo .env.local');
    return null;
  }

  const envFile = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};

  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remover comillas
      value = value.replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });

  return env;
}

async function verifyDoctorModule() {
  console.log('🏥 Verificando módulo de doctores...\n');

  const env = loadEnv();
  if (!env) {
    console.error('No se pudieron cargar las variables de entorno');
    process.exit(1);
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de Supabase no encontradas en .env.local');
    process.exit(1);
  }

  console.log('✅ Variables de entorno cargadas');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificar tablas
  console.log('📋 Verificando tablas del módulo de doctores...\n');
  
  const tables = [
    'doctor_profiles',
    'doctor_patients',
    'consultations',
    'consultation_attachments',
    'doctor_prescriptions',
    'shared_documents_with_doctor',
    'doctor_availability',
  ];

  let allTablesOk = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && !error.message.includes('no rows')) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesOk = false;
      } else {
        console.log(`✅ ${table}`);
      }
    } catch (err: any) {
      console.log(`❌ ${table}: ${err.message}`);
      allTablesOk = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allTablesOk) {
    console.log('✅ TODAS LAS TABLAS ESTÁN CREADAS CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('\n📝 Próximos pasos:');
    console.log('  1. Crea un perfil de doctor en la tabla doctor_profiles');
    console.log('  2. Reemplaza el mock con doctor.repo.real.ts en tus páginas');
    console.log('  3. Prueba creando consultas y recetas');
    console.log('\n📚 Ver documentación: DOCTOR_MODULE_README.md');
  } else {
    console.log('⚠️  ALGUNAS TABLAS NO ESTÁN DISPONIBLES');
    console.log('='.repeat(60));
    console.log('\n🔧 Ejecuta: supabase db push');
  }
}

verifyDoctorModule()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
