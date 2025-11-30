/**
 * Script para listar modelos disponibles de Gemini
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Leer .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

async function listModels() {
  const env = loadEnvLocal();
  const apiKey = env.NEXT_PUBLIC_GEMINI_API_KEY;

  console.log('📋 Listando modelos disponibles de Gemini...\n');

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Intentar diferentes modelos comunes
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Probando: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hola');
      await result.response;
      console.log(`✅ ${modelName} - FUNCIONA\n`);
      
      console.log('🎉 ¡Modelo encontrado!');
      console.log(`Usa este modelo: "${modelName}"`);
      return;
    } catch (error) {
      console.log(`❌ ${modelName} - ${error.message.substring(0, 100)}...\n`);
    }
  }

  console.log('❌ No se encontró ningún modelo funcional');
  console.log('\n💡 Posibles causas:');
  console.log('1. La API Key podría estar inválida o revocada');
  console.log('2. Necesitas actualizar @google/generative-ai: pnpm update @google/generative-ai');
  console.log('3. El servicio de Gemini podría estar temporalmente no disponible');
}

listModels().catch(console.error);
