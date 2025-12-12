/**
 * Script para detectar modelos disponibles usando la API REST directamente
 */

const https = require('https');
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

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function detectModels() {
  const env = loadEnvLocal();
  const apiKey = env.GEMINI_API_KEY;

  console.log('🔍 Detectando modelos disponibles con tu API Key...\n');
  console.log(`API Key: ${apiKey.substring(0, 20)}...\n`);

  try {
    // Listar todos los modelos disponibles
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('📡 Consultando modelos disponibles...\n');
    
    const response = await makeRequest(url);
    
    if (response.error) {
      console.error('❌ Error:', response.error.message);
      return;
    }

    if (!response.models || response.models.length === 0) {
      console.log('❌ No se encontraron modelos disponibles');
      return;
    }

    console.log(`✅ Se encontraron ${response.models.length} modelos:\n`);
    
    // Filtrar solo los modelos que soportan generateContent
    const generateModels = response.models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    if (generateModels.length === 0) {
      console.log('❌ Ningún modelo soporta generateContent');
      return;
    }

    console.log('📋 Modelos que soportan generateContent:\n');
    generateModels.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name.replace('models/', '')}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Métodos: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });

    // Recomendar el mejor modelo
    const recommended = generateModels.find(m => m.name.includes('flash')) || generateModels[0];
    const modelName = recommended.name.replace('models/', '');
    
    console.log('━'.repeat(60));
    console.log('🎯 MODELO RECOMENDADO PARA USAR:\n');
    console.log(`   "${modelName}"`);
    console.log('━'.repeat(60));
    console.log('\n✏️  Actualiza tu código para usar este modelo.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

detectModels();
