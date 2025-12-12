/**
 * Script de prueba para verificar que la API de Gemini funciona correctamente
 * Ejecutar con: node scripts/test-gemini.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

async function testGemini() {
  console.log('🧪 Probando conexión con Gemini AI...\n');

  // 1. Cargar y verificar API Key
  const env = loadEnvLocal();
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY no está definida en .env.local');
    process.exit(1);
  }

  console.log('✅ API Key encontrada:', apiKey.substring(0, 20) + '...');

  // 2. Inicializar Gemini
  try {
    console.log('\n🔧 Inicializando Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI inicializado correctamente');

    // 3. Hacer una prueba simple
    console.log('\n📝 Enviando mensaje de prueba...');
    const result = await model.generateContent('Di "Hola, funciono correctamente" en español');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta recibida:');
    console.log('---');
    console.log(text);
    console.log('---');
    
    console.log('\n🎉 ¡Gemini AI está funcionando correctamente!');
    console.log('\n📋 Siguiente paso:');
    console.log('   1. Reinicia tu servidor: Ctrl+C y luego npm run dev o pnpm dev');
    console.log('   2. Abre http://localhost:3000/dashboard/asistente-ia');
    console.log('   3. Intenta hacer una pregunta');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR al comunicarse con Gemini AI:');
    console.error('---');
    console.error(error.message);
    console.error('---');
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Solución: Tu API Key parece ser inválida.');
      console.error('   1. Ve a https://makersuite.google.com/app/apikey');
      console.error('   2. Genera una nueva API Key');
      console.error('   3. Reemplázala en .env.local');
    } else if (error.message.includes('quota')) {
      console.error('\n💡 Solución: Has excedido el límite de uso gratuito de Gemini.');
      console.error('   1. Espera unas horas');
      console.error('   2. O considera actualizar a un plan de pago');
    } else {
      console.error('\n💡 Error desconocido. Verifica:');
      console.error('   1. Tu conexión a internet');
      console.error('   2. Que la API Key sea válida');
      console.error('   3. Los logs completos arriba');
    }
    
    process.exit(1);
  }
}

testGemini();
