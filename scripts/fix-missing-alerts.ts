/**
 * Script para generar alertas faltantes de prescripciones existentes
 * 
 * Uso:
 * npx tsx scripts/fix-missing-alerts.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const apiKey = process.env.INTERNAL_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixMissingAlerts() {
  console.log('🔧 Buscando prescripciones sin alertas...\n');

  try {
    // 1. Obtener prescripciones recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        user_id,
        diagnosis,
        start_date,
        prescription_medicines (
          id,
          medicine_name,
          dosage,
          frequency_hours
        )
      `)
      .gte('start_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('start_date', { ascending: false });

    if (prescError) {
      console.error('❌ Error:', prescError);
      return;
    }

    console.log(`📋 ${prescriptions?.length || 0} prescripciones recientes encontradas\n`);

    if (!prescriptions || prescriptions.length === 0) {
      console.log('✅ No hay prescripciones recientes');
      return;
    }

    let alertsCreated = 0;

    for (const presc of prescriptions) {
      console.log(`\n📝 Procesando: ${presc.diagnosis} (${presc.start_date})`);
      
      const medicines = presc.prescription_medicines as any[];
      
      if (!medicines || medicines.length === 0) {
        console.log('   ⏭️ Sin medicamentos');
        continue;
      }

      for (const medicine of medicines) {
        // Verificar si ya existe alerta para este medicamento
        const { data: existingAlerts } = await supabase
          .from('custom_alerts')
          .select('id')
          .eq('user_id', presc.user_id)
          .eq('type', 'medication')
          .ilike('title', `%${medicine.medicine_name}%`)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (existingAlerts && existingAlerts.length > 0) {
          console.log(`   ✓ ${medicine.medicine_name} ya tiene alerta`);
          continue;
        }

        // Crear alerta usando el endpoint interno
        console.log(`   📤 Creando alerta para ${medicine.medicine_name}...`);
        
        try {
          const response = await fetch(`${appUrl}/api/alerts/auto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey || '',
            },
            body: JSON.stringify({
              event_type: 'medication_reminder',
              user_id: presc.user_id,
              data: {
                medicine_name: medicine.medicine_name,
                dosage: medicine.dosage,
                scheduled_at: new Date(presc.start_date).toISOString(),
                prescription_id: presc.id,
              },
            }),
          });

          if (response.ok) {
            console.log(`   ✅ Alerta creada para ${medicine.medicine_name}`);
            alertsCreated++;
          } else {
            const error = await response.text();
            console.log(`   ⚠️ No se pudo crear: ${error}`);
          }
        } catch (error) {
          console.error(`   ❌ Error:`, error);
        }
      }
    }

    console.log(`\n✅ Proceso completado. ${alertsCreated} alertas creadas.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixMissingAlerts();
