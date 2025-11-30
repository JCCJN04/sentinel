/**
 * Script para limpiar prescripciones y alertas antiguas
 * 
 * Uso:
 * npx tsx scripts/cleanup-old-prescriptions.ts
 * 
 * Este script elimina:
 * - Prescripciones con fecha anterior a hace 30 días
 * - Alertas de medicamentos antiguas
 * - Dosis programadas antiguas (ya pasadas)
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente con service role para bypassear RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOldData() {
  console.log('🧹 Iniciando limpieza de datos antiguos...\n');

  try {
    // Fecha límite: hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    console.log(`📅 Fecha de corte: ${cutoffDate}`);
    console.log(`📅 Se eliminarán prescripciones anteriores a esta fecha\n`);

    // 1. Eliminar dosis antiguas (scheduled_at < hoy)
    const today = new Date().toISOString();
    console.log('1️⃣ Eliminando dosis programadas antiguas...');
    
    const { data: oldDoses, error: dosesError } = await supabase
      .from('medication_doses')
      .delete()
      .lt('scheduled_at', today)
      .eq('status', 'scheduled')
      .select('id');

    if (dosesError) {
      console.error('   ❌ Error:', dosesError.message);
    } else {
      console.log(`   ✅ ${oldDoses?.length || 0} dosis antiguas eliminadas\n`);
    }

    // 2. Eliminar alertas de medicamentos antiguas
    console.log('2️⃣ Eliminando alertas de medicamentos antiguas...');
    
    const { data: oldAlerts, error: alertsError } = await supabase
      .from('custom_alerts')
      .delete()
      .eq('type', 'medication')
      .lt('created_at', cutoffDate)
      .select('id');

    if (alertsError) {
      console.error('   ❌ Error:', alertsError.message);
    } else {
      console.log(`   ✅ ${oldAlerts?.length || 0} alertas antiguas eliminadas\n`);
    }

    // 3. Listar prescripciones antiguas (para revisión)
    console.log('3️⃣ Buscando prescripciones antiguas...');
    
    const { data: oldPrescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select('id, diagnosis, start_date, doctor_name')
      .lt('start_date', cutoffDate)
      .order('start_date', { ascending: false });

    if (prescError) {
      console.error('   ❌ Error:', prescError.message);
    } else {
      console.log(`   📋 ${oldPrescriptions?.length || 0} prescripciones antiguas encontradas:`);
      
      if (oldPrescriptions && oldPrescriptions.length > 0) {
        oldPrescriptions.forEach((presc, index) => {
          console.log(`      ${index + 1}. ${presc.diagnosis} - ${presc.start_date} (${presc.doctor_name || 'Sin doctor'})`);
        });

        console.log('\n⚠️  Para eliminar estas prescripciones, ejecuta:');
        console.log('   npx tsx scripts/cleanup-old-prescriptions.ts --delete-prescriptions\n');
      } else {
        console.log('   ✅ No hay prescripciones antiguas\n');
      }
    }

    // 4. Si se pasó --delete-prescriptions, eliminar
    if (process.argv.includes('--delete-prescriptions')) {
      console.log('4️⃣ Eliminando prescripciones antiguas...');
      
      const { data: deletedPresc, error: deleteError } = await supabase
        .from('prescriptions')
        .delete()
        .lt('start_date', cutoffDate)
        .select('id');

      if (deleteError) {
        console.error('   ❌ Error:', deleteError.message);
      } else {
        console.log(`   ✅ ${deletedPresc?.length || 0} prescripciones eliminadas\n`);
      }
    }

    console.log('✅ Limpieza completada!\n');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

cleanupOldData();
