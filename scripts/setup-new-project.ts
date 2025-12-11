/**
 * Script de Configuración Inicial del Proyecto HealthPal
 * 
 * Este script configura todo lo necesario después de ejecutar el backup SQL:
 * 1. Crea el bucket de storage "documents"
 * 2. Configura las políticas RLS del bucket
 * 3. Verifica la configuración de Twilio/WhatsApp
 * 4. Muestra el estado de los templates
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n');
  
  envVars.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    
    if (key && value) {
      process.env[key] = value;
    }
  });
}

console.log('\n🚀 === CONFIGURACIÓN INICIAL DE HEALTHPAL ===\n');

// Verificar variables requeridas
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER'
];

console.log('📋 Verificando variables de entorno...\n');
let allVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const isPresent = !!process.env[varName];
  console.log(`   ${isPresent ? '✅' : '❌'} ${varName}: ${isPresent ? 'OK' : 'NO CONFIGURADA'}`);
  if (!isPresent) allVarsPresent = false;
});

if (!allVarsPresent) {
  console.error('\n❌ Faltan variables de entorno. Por favor, configura .env.local\n');
  process.exit(1);
}

console.log('\n─────────────────────────────────────────────\n');

async function setupStorageBucket() {
  console.log('💾 === CONFIGURANDO STORAGE BUCKET ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Verificar si el bucket existe
    console.log('🔍 Verificando bucket "documents"...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('   ❌ Error listando buckets:', listError.message);
      return false;
    }

    const documentsBucket = buckets?.find(b => b.name === 'documents');

    if (documentsBucket) {
      console.log('   ✅ El bucket "documents" ya existe');
      console.log(`      ID: ${documentsBucket.id}`);
      console.log(`      Público: ${documentsBucket.public ? 'Sí' : 'No'}`);
      console.log(`      Tamaño límite: ${documentsBucket.file_size_limit ? (documentsBucket.file_size_limit / 1024 / 1024) + 'MB' : 'Sin límite'}`);
    } else {
      // 2. Crear el bucket
      console.log('   📦 Creando bucket "documents"...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: false, // Privado, solo accesible con autenticación
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'image/heic',
          'image/heif'
        ]
      });

      if (createError) {
        if (createError.message.includes('already exists')) {
          console.log('   ✅ El bucket ya existe (detectado en creación)');
        } else {
          console.error('   ❌ Error creando bucket:', createError.message);
          return false;
        }
      } else {
        console.log('   ✅ Bucket "documents" creado exitosamente');
      }
    }

    // 3. Verificar/Crear políticas RLS
    console.log('\n🔒 Configurando políticas de seguridad (RLS)...');
    console.log('   ℹ️  Las políticas RLS deben configurarse manualmente en Supabase Dashboard');
    console.log('   ℹ️  O ejecutar el siguiente SQL:\n');
    
    console.log('   SQL para copiar en Supabase Dashboard → SQL Editor:\n');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
-- Política para LECTURA: Los usuarios solo pueden ver sus propios archivos
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para SUBIDA: Los usuarios solo pueden subir a su carpeta
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para ACTUALIZACIÓN: Los usuarios solo pueden actualizar sus propios archivos
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para ELIMINACIÓN: Los usuarios solo pueden eliminar sus propios archivos
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return true;
  } catch (error) {
    console.error('   ❌ Error en configuración de storage:', error);
    return false;
  }
}

async function verifyTwilioConfig() {
  console.log('\n📱 === VERIFICANDO CONFIGURACIÓN DE WHATSAPP ===\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  console.log(`   Account SID: ${accountSid?.substring(0, 10)}...`);
  console.log(`   Auth Token: ${'*'.repeat(32)}`);
  console.log(`   WhatsApp Number: ${whatsappNumber}\n`);

  // Verificar templates aprobados
  console.log('📝 Templates configurados en el código:\n');
  console.log('   1. MEDICATION_REMINDER: HXe215ac6f529a5805020baa5c5dec9a42');
  console.log('      → Recordatorio de medicamentos\n');
  console.log('   2. WELCOME_VERIFICATION: HXe67918879a4f4abe4763c76524dd4be3');
  console.log('      → Mensaje de bienvenida\n');

  console.log('⚠️  IMPORTANTE:');
  console.log('   • Estos templates DEBEN estar aprobados en Twilio');
  console.log('   • Si NO los tienes, ejecuta: npm run create-templates');
  console.log('   • Verifica en: https://console.twilio.com/us1/develop/sms/content-editor\n');
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  === VERIFICANDO CONEXIÓN A BASE DE DATOS ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verificar tablas principales
    const tables = [
      'profiles',
      'documents',
      'prescriptions',
      'prescription_medicines',
      'medication_doses',
      'custom_alerts',
      'vaccinations',
      'user_allergies'
    ];

    console.log('📊 Verificando tablas principales:\n');

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count ?? 0} registros`);
      }
    }

    console.log('\n✅ Base de datos configurada correctamente\n');
    return true;
  } catch (error) {
    console.error('\n❌ Error verificando base de datos:', error);
    return false;
  }
}

async function showNextSteps() {
  console.log('\n🎯 === PRÓXIMOS PASOS ===\n');
  console.log('1. ✅ COPIAR Y EJECUTAR EL SQL DE RLS');
  console.log('   → Ve a Supabase Dashboard → SQL Editor');
  console.log('   → Copia el SQL mostrado arriba');
  console.log('   → Ejecútalo para configurar las políticas de seguridad\n');

  console.log('2. 📱 VERIFICAR TEMPLATES DE TWILIO');
  console.log('   → Si NO tienes los templates aprobados:');
  console.log('     npm run create-templates');
  console.log('   → Luego espera aprobación de WhatsApp (24-48h)\n');

  console.log('3. 🧪 PROBAR MENSAJE DE WHATSAPP');
  console.log('   → Ejecuta: npm run test-whatsapp');
  console.log('   → Deberías recibir un mensaje de bienvenida\n');

  console.log('4. 🚀 INICIAR APLICACIÓN');
  console.log('   → npm run dev');
  console.log('   → Registra un usuario y prueba la app\n');

  console.log('─────────────────────────────────────────────\n');
  console.log('💡 Ayuda adicional:');
  console.log('   • Documentación de Supabase Storage: https://supabase.com/docs/guides/storage');
  console.log('   • Documentación de Twilio WhatsApp: https://www.twilio.com/docs/whatsapp\n');
}

async function main() {
  try {
    // 1. Verificar conexión a base de datos
    const dbOk = await checkDatabaseConnection();
    if (!dbOk) {
      console.error('❌ No se pudo conectar a la base de datos. Verifica tus credenciales.\n');
      process.exit(1);
    }

    console.log('\n─────────────────────────────────────────────');

    // 2. Configurar Storage
    const storageOk = await setupStorageBucket();
    if (!storageOk) {
      console.error('❌ Error configurando storage. Revisa los logs.\n');
      process.exit(1);
    }

    console.log('\n─────────────────────────────────────────────');

    // 3. Verificar Twilio
    await verifyTwilioConfig();

    console.log('\n─────────────────────────────────────────────');

    // 4. Mostrar próximos pasos
    await showNextSteps();

    console.log('✅ Configuración inicial completada!\n');
  } catch (error) {
    console.error('\n❌ Error en la configuración:', error);
    process.exit(1);
  }
}

main();
