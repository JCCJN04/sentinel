import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bcaxdxrngsfhpptsrpkd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXhkeHJuZ3NmaHBwdHNycGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MDAwOSwiZXhwIjoyMDY2MTE2MDA5fQ.1E4A82gpO1gKo4XQfLUPhal_C8vgn2LtdTfvt9sKJIU'
);

async function verify() {
  console.log('\n=== ÚLTIMA RECETA ===\n');
  
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, user_id, diagnosis, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!prescriptions || prescriptions.length === 0) {
    console.log('No hay recetas');
    return;
  }

  const rx = prescriptions[0];
  console.log('Diagnóstico:', rx.diagnosis);
  console.log('User ID:', rx.user_id);
  console.log('Creada:', new Date(rx.created_at).toLocaleString('es-MX'));

  // Obtener medicamentos
  const { data: meds } = await supabase
    .from('prescription_medicines')
    .select('id, medicine_name, dosage, frequency_hours, duration')
    .eq('prescription_id', rx.id);

  console.log('\nMedicamentos:', meds?.length || 0);
  meds?.forEach(m => {
    console.log(`  - ${m.medicine_name} ${m.dosage}`);
    console.log(`    Frecuencia: ${m.frequency_hours}h, Duración: ${m.duration} días`);
  });

  // Obtener dosis
  const { data: doses, error: dosesError } = await supabase
    .from('medication_doses')
    .select('id, scheduled_at, status')
    .in('prescription_medicine_id', meds?.map(m => m.id) || [])
    .order('scheduled_at', { ascending: true });

  if (dosesError) {
    console.error('\n❌ Error consultando dosis:', dosesError);
    return;
  }

  console.log('\nDosis programadas:', doses?.length || 0);
  
  if (doses && doses.length > 0) {
    doses.forEach((d, i) => {
      const time = new Date(d.scheduled_at);
      console.log(`  ${i + 1}. ${time.toLocaleDateString('es-MX')} ${time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - ${d.status}`);
    });
  }

  // Verificar alertas
  const { data: alerts } = await supabase
    .from('custom_alerts')
    .select('id, title, trigger_date')
    .eq('related_id', rx.id)
    .eq('related_type', 'prescription');

  console.log('\nAlertas generadas:', alerts?.length || 0);
  alerts?.forEach(a => {
    console.log(`  - ${a.title}`);
  });

  console.log('\n');
}

verify();
