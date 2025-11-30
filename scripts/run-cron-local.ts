/**
 * Script para ejecutar cron jobs localmente en desarrollo
 * 
 * Uso:
 * npx tsx scripts/run-cron-local.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let cronSecret = 'dev-secret-123';
let appUrl = 'http://localhost:3000';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key === 'CRON_SECRET') cronSecret = value;
      if (key === 'NEXT_PUBLIC_APP_URL') appUrl = value;
    }
  });
}

async function runCronLocal() {
  console.log('🔄 Ejecutando cron job local...');
  console.log(`📍 URL: ${appUrl}/api/cron/alerts?task=check-alerts`);
  console.log(`🔑 Secret: ${cronSecret.substring(0, 10)}...`);

  try {
    const response = await fetch(`${appUrl}/api/cron/alerts?task=check-alerts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cron job ejecutado exitosamente');
      console.log(result);
    } else {
      console.error('❌ Error al ejecutar cron job:', result);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

runCronLocal();
