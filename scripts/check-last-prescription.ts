import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLastPrescription() {
  const now = new Date().toISOString();
  
  // Obtener última receta
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, diagnosis, start_date, end_date, created_at, prescribing_doctor')
    .eq('user_id', '04b38c50-15a6-406c-8f14-2b4aab12507d')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!prescriptions || prescriptions.length === 0) {
    console.log('❌ No se encontró receta');
    return;
  }

  const rx = prescriptions[0];
  console.log('\n📋 === RECETA ===');
  console.log('ID:', rx.id);
  console.log('Diagnóstico:', rx.diagnosis);
  console.log('Doctor:', rx.prescribing_doctor || 'No especificado');
  console.log('Inicio:', rx.start_date);
  console.log('Fin:', rx.end_date);
  console.log('Creada:', rx.created_at);

  // Obtener medicamentos
  const { data: meds } = await supabase
    .from('prescription_medicines')
    .select('*')
    .eq('prescription_id', rx.id);

  console.log('\n💊 === MEDICAMENTOS ===');
  meds?.forEach(m => {
    console.log(`- ${m.medicine_name} ${m.dosage}`);
    console.log(`  Cada ${m.frequency_hours}h por ${m.duration_days} días`);
  });

  // Obtener dosis programadas
  const { data: doses } = await supabase
    .from('medication_doses')
    .select('*')
    .eq('prescription_id', rx.id)
    .order('scheduled_at', { ascending: true });

  console.log(`\n⏰ === DOSIS PROGRAMADAS (${doses?.length || 0}) ===`);
  const futuras = doses?.filter(d => new Date(d.scheduled_at) >= new Date(now)) || [];
  const pasadas = doses?.filter(d => new Date(d.scheduled_at) < new Date(now)) || [];
  
  console.log(`✅ Dosis futuras: ${futuras.length}`);
  console.log(`❌ Dosis pasadas: ${pasadas.length}`);
  
  console.log('\nDETALLE:');
  doses?.forEach((d, i) => {
    const isPast = new Date(d.scheduled_at) < new Date(now);
    const time = new Date(d.scheduled_at).toLocaleString('es-MX');
    console.log(`${i + 1}. ${time} ${isPast ? '❌ YA PASÓ' : '✅ FUTURA'}`);
  });

  // Obtener alertas
  const { data: alerts } = await supabase
    .from('custom_alerts')
    .select('*')
    .eq('related_id', rx.id)
    .eq('related_type', 'prescription');

  console.log(`\n🔔 === ALERTAS GENERADAS (${alerts?.length || 0}) ===`);
  alerts?.forEach(a => {
    console.log(`- ${a.title}`);
    console.log(`  Fecha: ${a.trigger_date}`);
  });

  console.log('\n⚠️ === DIAGNÓSTICO ===');
  if (pasadas.length === doses?.length) {
    console.log('❌ PROBLEMA: Todas las dosis ya pasaron');
    console.log('   No aparecerán en el dashboard porque solo se muestran dosis futuras');
  } else if (futuras.length > 0) {
    console.log('✅ OK: Hay dosis futuras que aparecerán en el dashboard');
  }

  if (!alerts || alerts.length === 0) {
    console.log('⚠️ ADVERTENCIA: No se generaron alertas');
    console.log('   Esto es normal si la primera dosis ya pasó');
  }
}

checkLastPrescription();
