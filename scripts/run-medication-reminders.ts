/**
 * Script para ejecutar el cron de alertas directamente
 * Sin necesidad de servidor HTTP
 */

import { createClient } from '@supabase/supabase-js';
import { sendMedicationReminder } from '../lib/whatsapp-service';
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

async function runMedicationReminders() {
  console.log('🏥 === EJECUTANDO RECORDATORIOS DE MEDICAMENTOS ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    console.log(`⏰ Buscando dosis programadas...\n`);

    // Buscar dosis programadas:
    // 1. Entre ahora y +15 minutos (dosis que ya es hora de tomar - "Es hora de...")
    // 2. Entre +45 minutos y +1h15m (dosis próximas - "En 1 hora debes...")
    const fortyFiveMinutesFromNow = new Date(now.getTime() + 45 * 60 * 1000);
    const oneHourFifteenFromNow = new Date(now.getTime() + 75 * 60 * 1000);

    // Consulta 1: Dosis para tomar AHORA (dentro de los próximos 15 minutos)
    const { data: immediateDoses, error: error1 } = await supabase
      .from('medication_doses')
      .select(`
        id,
        scheduled_at,
        user_id,
        prescription_medicine_id,
        prescription_medicines(
          medicine_name,
          dosage,
          instructions
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', fifteenMinutesFromNow.toISOString());

    // Consulta 2: Dosis para tomar EN 1 HORA (entre 45min y 1h15m)
    const { data: upcomingDoses, error: error2 } = await supabase
      .from('medication_doses')
      .select(`
        id,
        scheduled_at,
        user_id,
        prescription_medicine_id,
        prescription_medicines(
          medicine_name,
          dosage,
          instructions
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', fortyFiveMinutesFromNow.toISOString())
      .lte('scheduled_at', oneHourFifteenFromNow.toISOString());

    if (error1 || error2) {
      console.error('❌ Error consultando dosis:', error1 || error2);
      return;
    }

    const totalDoses = (immediateDoses?.length || 0) + (upcomingDoses?.length || 0);
    console.log(`📋 Encontradas ${totalDoses} dosis:`);
    console.log(`   🔴 ${immediateDoses?.length || 0} para tomar AHORA`);
    console.log(`   🟡 ${upcomingDoses?.length || 0} para tomar en 1 HORA\n`);

    if (totalDoses === 0) {
      console.log('💡 No hay dosis programadas para enviar recordatorios\n');
      return;
    }

    // Procesar dosis inmediatas (ES HORA DE TOMAR)
    if (immediateDoses && immediateDoses.length > 0) {
      console.log('🔴 === PROCESANDO DOSIS INMEDIATAS ===\n');
      for (const dose of immediateDoses) {
        await processDose(dose, supabase, 'immediate');
      }
    }

    // Procesar dosis próximas (EN 1 HORA)
    if (upcomingDoses && upcomingDoses.length > 0) {
      console.log('\n🟡 === PROCESANDO RECORDATORIOS (1 HORA ANTES) ===\n');
      for (const dose of upcomingDoses) {
        await processDose(dose, supabase, 'upcoming');
      }
    }

    console.log('🎉 Proceso completado\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function processDose(dose: any, supabase: any, type: 'immediate' | 'upcoming') {
  const medicine = dose.prescription_medicines as any;
  
  const emoji = type === 'immediate' ? '🔴' : '🟡';
  const timeLabel = type === 'immediate' ? 'ES HORA' : 'En 1 hora';
  
  console.log(`${emoji} ${medicine?.medicine_name || 'Medicamento'}`);
  console.log(`   Hora programada: ${new Date(dose.scheduled_at).toLocaleTimeString()}`);

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, phone_number, whatsapp_notifications_enabled')
    .eq('id', dose.user_id)
    .single();

  if (!profile) {
    console.log('   ⚠️  Perfil no encontrado\n');
    return;
  }

  console.log(`   Usuario: ${profile.first_name || 'Usuario'}`);
  console.log(`   WhatsApp: ${profile.whatsapp_notifications_enabled ? 'Habilitado' : 'Deshabilitado'}`);
  console.log(`   Teléfono: ${profile.phone_number || 'No configurado'}`);

  if (!profile.whatsapp_notifications_enabled || !profile.phone_number) {
    console.log('   ⏭️  WhatsApp no habilitado, saltando...\n');
    return;
  }

  // Enviar recordatorio
  const scheduledTime = new Date(dose.scheduled_at);
  const timeString = scheduledTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  console.log(`   📤 Enviando WhatsApp a ${profile.phone_number}...`);

  const result = await sendMedicationReminder(profile.phone_number, {
    patientName: profile.first_name || 'Usuario',
    medicineName: medicine?.medicine_name || 'Medicamento',
    dosage: medicine?.dosage || '',
    scheduledTime: timeString,
    instructions: medicine?.instructions,
    isImmediate: type === 'immediate',
  });

  if (result.success) {
    console.log(`   ✅ WhatsApp enviado! SID: ${result.messageId}\n`);
  } else {
    console.log(`   ❌ Error: ${result.error}\n`);
  }
}

runMedicationReminders();
