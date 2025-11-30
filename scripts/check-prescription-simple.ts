import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bcaxdxrngsfhpptsrpkd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXhkeHJuZ3NmaHBwdHNycGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MDAwOSwiZXhwIjoyMDY2MTE2MDA5fQ.1E4A82gpO1gKo4XQfLUPhal_C8vgn2LtdTfvt9sKJIU'
);

async function check() {
  const now = new Date();
  
  // Última receta
  const { data: rx } = await supabase
    .from('prescriptions')
    .select('id, diagnosis, start_date, end_date, created_at')
    .eq('user_id', '04b38c50-15a6-406c-8f14-2b4aab12507d')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!rx) {
    console.log('No se encontró receta');
    return;
  }

  console.log('\n📋 RECETA');
  console.log('Diagnóstico:', rx.diagnosis);
  console.log('Inicio:', rx.start_date, rx.created_at.split('T')[1].split('.')[0].substring(0, 5));
  console.log('Fin:', rx.end_date);
  console.log('Creada:', new Date(rx.created_at).toLocaleString('es-MX'));

  // Dosis
  const { data: doses } = await supabase
    .from('medication_doses')
    .select('*')
    .eq('prescription_id', rx.id)
    .order('scheduled_at', { ascending: true });

  console.log('\n⏰ DOSIS PROGRAMADAS');
  console.log('Total:', doses?.length || 0);
  
  const futuras = doses?.filter(d => new Date(d.scheduled_at) >= now) || [];
  const pasadas = doses?.filter(d => new Date(d.scheduled_at) < now) || [];
  
  console.log('Futuras:', futuras.length);
  console.log('Pasadas:', pasadas.length);
  
  console.log('\nDETALLE:');
  doses?.forEach((d, i) => {
    const isPast = new Date(d.scheduled_at) < now;
    const date = new Date(d.scheduled_at);
    console.log(`${i + 1}. ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - ${d.medicine_name} ${isPast ? '❌ YA PASÓ' : '✅ FUTURA'}`);
  });

  console.log('\n⚠️ DIAGNÓSTICO:');
  if (pasadas.length === doses?.length) {
    console.log('❌ PROBLEMA DETECTADO:');
    console.log('   Todas las dosis ya pasaron.');
    console.log('   NO aparecerán en el dashboard porque solo muestra dosis futuras.');
    console.log('\n💡 SOLUCIÓN:');
    console.log('   Crear la receta con fecha/hora FUTURA.');
    console.log('   Ejemplo: Si son las 11:00 AM, poner inicio 12:00 PM.');
  } else {
    console.log('✅ OK: Hay', futuras.length, 'dosis futuras que SÍ aparecerán en el dashboard');
  }
}

check();
