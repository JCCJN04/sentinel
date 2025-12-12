/**
 * Script para verificar el estado de los Content Templates en Twilio
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkTemplateStatus() {
  console.log('📱 Verificando templates de WhatsApp en Twilio...\n');

  const templates = {
    welcome_verification: 'HXed4dad300cdd95154003a6998b0d4d1f',
    medication_reminder: 'HX7a90a5d7840f9e6139f1efbd526700d3'
  };

  for (const [name, sid] of Object.entries(templates)) {
    try {
      console.log(`\n🔍 Template: ${name}`);
      console.log(`   SID: ${sid}`);
      
      const content = await client.content.v1.contents(sid).fetch();
      
      console.log(`   Estado: ${content.approvalRequests?.status || 'unknown'}`);
      console.log(`   Lenguaje: ${content.language}`);
      console.log(`   Tipo: ${content.types}`);
      
      if (content.approvalRequests) {
        console.log(`   Aprobación: ${JSON.stringify(content.approvalRequests, null, 2)}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verificar mensajes recientes
  console.log('\n\n📨 Verificando mensajes recientes...');
  try {
    const messages = await client.messages.list({ limit: 5 });
    
    messages.forEach((msg, idx) => {
      console.log(`\n${idx + 1}. Mensaje ${msg.sid}`);
      console.log(`   Para: ${msg.to}`);
      console.log(`   Estado: ${msg.status}`);
      console.log(`   Error: ${msg.errorCode || 'ninguno'} - ${msg.errorMessage || 'N/A'}`);
      console.log(`   Fecha: ${msg.dateCreated}`);
    });
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
  }
}

checkTemplateStatus().then(() => {
  console.log('\n✅ Verificación completa');
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
