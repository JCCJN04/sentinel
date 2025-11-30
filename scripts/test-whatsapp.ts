/**
 * Script de prueba para WhatsApp
 * 
 * Prueba el envío de mensajes de WhatsApp usando Twilio
 */

import { sendTestMessage, sendMedicationReminder } from '../lib/whatsapp-service';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno desde .env.local
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

async function main() {
  console.log('🧪 === PRUEBA DE WHATSAPP CON TWILIO ===\n');

  // Verificar configuración
  console.log('📋 Verificando configuración...');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('❌ ERROR: Faltan credenciales de Twilio en .env.local');
    console.error(`   TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Configurado' : '❌ Falta'}`);
    console.error(`   TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configurado' : '❌ Falta'}`);
    console.error(`   TWILIO_WHATSAPP_NUMBER: ${fromNumber ? '✅ Configurado' : '❌ Falta'}`);
    process.exit(1);
  }

  console.log('✅ Credenciales encontradas');
  console.log(`   Account SID: ${accountSid.substring(0, 10)}...`);
  console.log(`   From Number: ${fromNumber}\n`);

  // Solicitar número de destino
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => readline.question(query, resolve));
  };

  try {
    // Pedir número de destino
    console.log('📱 Ingresa el número de WhatsApp de destino');
    console.log('   Formato: +5218111230266 (para México incluye el 1)');
    console.log('   Presiona Enter para usar: +5218111230266');
    const input = await askQuestion('   Número (o Enter): ');
    const toNumber = input.trim() || '+5218111230266';

    if (!toNumber || !toNumber.startsWith('+')) {
      console.error('❌ Número inválido. Debe empezar con + y código de país');
      process.exit(1);
    }

    console.log('\n📤 Enviando mensaje de prueba...\n');

    // Enviar mensaje de prueba
    const result = await sendTestMessage(toNumber);

    if (result.success) {
      console.log('✅ ¡Mensaje enviado exitosamente!');
      console.log(`   Message SID: ${result.messageId}`);
      console.log('\n📱 Revisa tu WhatsApp. Deberías recibir el mensaje en unos segundos.');
      console.log('\n💡 Si no llega:');
      console.log('   1. Verifica que enviaste "join <código>" al número de Twilio');
      console.log('   2. Verifica el formato del número (+código_país + número)');
      console.log('   3. Revisa los logs en https://console.twilio.com/');
    } else {
      console.error('❌ Error enviando mensaje:');
      console.error(`   ${result.error}`);
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica las credenciales en .env.local');
      console.error('   2. Asegúrate de estar usando el sandbox de WhatsApp');
      console.error('   3. Revisa que el número esté en el formato correcto');
    }

    // Preguntar si quiere probar recordatorio de medicamento
    console.log('\n' + '='.repeat(50));
    const testReminder = await askQuestion('\n¿Quieres probar un recordatorio de medicamento? (s/n): ');

    if (testReminder.toLowerCase() === 's') {
      console.log('\n📤 Enviando recordatorio de medicamento...\n');

      const reminderResult = await sendMedicationReminder(toNumber, {
        patientName: 'Usuario de Prueba',
        medicineName: 'Paracetamol',
        dosage: '500mg',
        scheduledTime: '14:30',
        instructions: 'Tomar con alimentos',
      });

      if (reminderResult.success) {
        console.log('✅ ¡Recordatorio enviado exitosamente!');
        console.log(`   Message SID: ${reminderResult.messageId}`);
      } else {
        console.error('❌ Error enviando recordatorio:');
        console.error(`   ${reminderResult.error}`);
      }
    }

    console.log('\n🎉 Prueba completada');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    readline.close();
  }
}

main();
