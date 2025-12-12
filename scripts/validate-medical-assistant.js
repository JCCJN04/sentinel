/**
 * Script de Validación del Módulo Asistente IA Médico
 * 
 * Verifica que todas las dependencias y configuraciones estén correctas
 * Ejecutar con: node scripts/validate-medical-assistant.js
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 Validando Módulo Asistente IA Médico...\n');

let hasErrors = false;

// 1. Verificar variables de entorno
console.log('📋 1. Verificando variables de entorno...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('   ❌ No se encontró .env.local');
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Verificar Gemini API Key
  if (!envContent.includes('GEMINI_API_KEY')) {
    console.error('   ❌ Falta GEMINI_API_KEY en .env.local');
    hasErrors = true;
  } else if (envContent.includes('GEMINI_API_KEY=your_gemini_api_key')) {
    console.error('   ⚠️  GEMINI_API_KEY no está configurada (usa valor de ejemplo)');
    hasErrors = true;
  } else {
    console.log('   ✅ GEMINI_API_KEY configurada');
  }
  
  // Verificar Supabase
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.error('   ❌ Falta NEXT_PUBLIC_SUPABASE_URL en .env.local');
    hasErrors = true;
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL configurada');
  }
  
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.error('   ❌ Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
    hasErrors = true;
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurada');
  }
}

// 2. Verificar archivos del módulo
console.log('\n📁 2. Verificando archivos del módulo...');

const requiredFiles = [
  'types/medical-assistant.ts',
  'lib/medical-assistant-service.ts',
  'app/api/ai/medical-chat/route.ts',
  'components/medical-assistant/medical-chat-interface.tsx',
  'components/medical-assistant/suggested-questions.tsx',
  'app/dashboard/asistente-ia/page.tsx',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.error(`   ❌ No se encontró: ${file}`);
    hasErrors = true;
  }
});

// 3. Verificar package.json
console.log('\n📦 3. Verificando dependencias...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const requiredDeps = {
    '@google/generative-ai': 'Google Gemini AI',
    '@supabase/supabase-js': 'Supabase Client',
    '@supabase/ssr': 'Supabase SSR',
  };
  
  Object.entries(requiredDeps).forEach(([dep, name]) => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${name} (${dep})`);
    } else {
      console.error(`   ❌ Falta dependencia: ${name} (${dep})`);
      hasErrors = true;
    }
  });
} else {
  console.error('   ❌ No se encontró package.json');
  hasErrors = true;
}

// 4. Verificar configuración de navegación
console.log('\n🧭 4. Verificando navegación...');
const navConfigPath = path.join(__dirname, '..', 'config', 'dashboard-nav.ts');
if (fs.existsSync(navConfigPath)) {
  const navContent = fs.readFileSync(navConfigPath, 'utf-8');
  if (navContent.includes('asistente-ia')) {
    console.log('   ✅ Ruta del asistente agregada al menú');
  } else {
    console.error('   ❌ La ruta del asistente no está en el menú');
    hasErrors = true;
  }
  
  if (navContent.includes('Bot')) {
    console.log('   ✅ Icono Bot importado');
  } else {
    console.error('   ❌ Falta importar icono Bot');
    hasErrors = true;
  }
} else {
  console.error('   ❌ No se encontró config/dashboard-nav.ts');
  hasErrors = true;
}

// 5. Verificar estructura de base de datos (informativo)
console.log('\n🗄️  5. Tablas de base de datos requeridas:');
const requiredTables = [
  'profiles',
  'documents',
  'prescriptions',
  'prescription_medicines',
  'user_allergies',
  'vaccinations',
  'user_personal_history',
  'user_family_history',
];

console.log('   ℹ️  Asegúrate de tener estas tablas en Supabase:');
requiredTables.forEach(table => {
  console.log(`      - ${table}`);
});

// Resumen final
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ VALIDACIÓN FALLIDA - Hay errores que corregir');
  console.log('\nPasos para solucionar:');
  console.log('1. Copia .env.example a .env.local');
  console.log('2. Configura tu GEMINI_API_KEY (servidor) y otras variables');
  console.log('3. Verifica que Supabase esté configurado');
  console.log('4. Ejecuta: npm install o pnpm install');
  console.log('5. Verifica que las tablas existan en Supabase');
  process.exit(1);
} else {
  console.log('✅ VALIDACIÓN EXITOSA - El módulo está listo para usar');
  console.log('\nPróximos pasos:');
  console.log('1. Ejecuta: npm run dev o pnpm dev');
  console.log('2. Navega a /dashboard/asistente-ia');
  console.log('3. ¡Comienza a chatear con tu asistente médico!');
  process.exit(0);
}
