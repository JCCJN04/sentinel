/**
 * Script para verificar el estado del sandbox de WhatsApp en Twilio
 */

import twilio from 'twilio';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n');
  
  envVars.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    
    if (key && value) {
      process.env[key] = value;
    }
  });
}

async function checkSandboxStatus() {
  console.log('🔍 === VERIFICANDO ESTADO DE WHATSAPP SANDBOX ===\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('❌ Credenciales de Twilio no configuradas');
    process.exit(1);
  }

  try {
    const client = twilio(accountSid, authToken);

    console.log('📋 Últimos mensajes enviados:\n');

    // Obtener los últimos 5 mensajes
    const messages = await client.messages.list({ limit: 5 });

    if (messages.length === 0) {
      console.log('   No se encontraron mensajes');
    } else {
      messages.forEach((msg, index) => {
        const status = msg.status === 'delivered' ? '✅' : 
                      msg.status === 'sent' ? '📤' :
                      msg.status === 'failed' ? '❌' : '⏳';
        
        console.log(`${index + 1}. ${status} ${msg.status.toUpperCase()}`);
        console.log(`   Para: ${msg.to}`);
        console.log(`   Fecha: ${msg.dateCreated}`);
        
        if (msg.errorCode) {
          console.log(`   ❌ Error ${msg.errorCode}: ${msg.errorMessage}`);
        }
        
        console.log('');
      });
    }

    // Información sobre el sandbox
    console.log('═'.repeat(60));
    console.log('\n📱 CÓMO ACTIVAR EL SANDBOX:\n');
    console.log('1. Abre WhatsApp en tu teléfono');
    console.log('2. Envía un mensaje a: +1 415 523 8886');
    console.log('3. Mensaje: join <código-sandbox>');
    console.log('\n4. Ve a Twilio Console para obtener el código:');
    console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
    console.log('\n5. Recibirás un mensaje de confirmación de Twilio');
    console.log('\n═'.repeat(60));

    // Verificar si hay errores comunes
    const failedMessages = messages.filter(m => m.status === 'failed' || m.status === 'undelivered');
    
    if (failedMessages.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:\n');
      
      failedMessages.forEach(msg => {
        if (msg.errorCode === 63007) {
          console.log('❌ Error 63007: El número no está en el sandbox');
          console.log('   Solución: Envía "join <código>" desde tu WhatsApp\n');
        } else if (msg.errorCode === 63008) {
          console.log('❌ Error 63008: Número de origen inválido');
          console.log('   Solución: Verifica TWILIO_WHATSAPP_NUMBER en .env.local\n');
        } else if (msg.errorCode) {
          console.log(`❌ Error ${msg.errorCode}: ${msg.errorMessage}\n`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error consultando Twilio:', error);
    
    if (error instanceof Error && error.message.includes('authenticate')) {
      console.error('\n💡 Las credenciales parecen incorrectas.');
      console.error('   Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en .env.local');
    }
  }
}

checkSandboxStatus();
