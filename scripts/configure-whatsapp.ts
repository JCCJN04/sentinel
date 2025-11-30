/**
 * Script para configurar WhatsApp en el perfil del usuario
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

async function configureWhatsApp() {
  console.log('📱 === CONFIGURACIÓN DE WHATSAPP ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de Supabase no configuradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Obtener el usuario actual (asumiendo que hay al menos uno)
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, phone_number, whatsapp_notifications_enabled')
      .limit(10);

    if (fetchError) {
      console.error('❌ Error consultando perfiles:', fetchError);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ No se encontraron perfiles en la base de datos');
      process.exit(1);
    }

    console.log('📋 Perfiles encontrados:\n');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.first_name || 'Sin nombre'} (${profile.id.substring(0, 8)}...)`);
      console.log(`   Teléfono: ${profile.phone_number || 'No configurado'}`);
      console.log(`   WhatsApp: ${profile.whatsapp_notifications_enabled ? '✅ Habilitado' : '❌ Deshabilitado'}\n`);
    });

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
      return new Promise(resolve => readline.question(query, resolve));
    };

    // Preguntar qué perfil actualizar
    const profileIndex = await askQuestion('Selecciona el número de perfil a configurar (1-' + profiles.length + '): ');
    const selectedProfile = profiles[parseInt(profileIndex) - 1];

    if (!selectedProfile) {
      console.error('❌ Perfil no válido');
      readline.close();
      process.exit(1);
    }

    console.log(`\n✅ Configurando: ${selectedProfile.first_name || 'Usuario'}\n`);

    // Actualizar el perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_number: '+5218111230266',
        whatsapp_notifications_enabled: true,
      })
      .eq('id', selectedProfile.id);

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError);
      readline.close();
      process.exit(1);
    }

    console.log('✅ Perfil actualizado exitosamente!\n');
    console.log('📱 Número configurado: +5218111230266');
    console.log('🔔 Notificaciones: Habilitadas\n');

    console.log('🎉 ¡Todo listo! Ahora recibirás recordatorios de medicamentos por WhatsApp\n');
    console.log('💡 Para probar:');
    console.log('   1. Crea una receta con un medicamento');
    console.log('   2. Programa la primera dosis para dentro de 30 minutos');
    console.log('   3. Ejecuta: npx tsx scripts/run-cron-local.ts');
    console.log('   4. Recibirás el WhatsApp 1 hora antes de la dosis\n');

    readline.close();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configureWhatsApp();
