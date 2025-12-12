/**
 * Verificar estado de aprobación detallado de templates
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkApprovalStatus() {
  const templateSid = 'HXed4dad300cdd95154003a6998b0d4d1f';
  
  console.log('🔍 Verificando template de bienvenida...\n');
  
  try {
    const content = await client.content.v1.contents(templateSid).fetch();
    
    console.log('📋 Información del Template:');
    console.log(`   SID: ${content.sid}`);
    console.log(`   Nombre amigable: ${content.friendlyName}`);
    console.log(`   Lenguaje: ${content.language}`);
    console.log(`   Fecha creación: ${content.dateCreated}`);
    console.log(`   Fecha actualización: ${content.dateUpdated}`);
    
    console.log('\n📱 Estado de Aprobación:');
    if (content.approvalRequests) {
      console.log(JSON.stringify(content.approvalRequests, null, 2));
    } else {
      console.log('   ⚠️ No hay información de aprobación disponible');
    }
    
    console.log('\n📝 Variables del template:');
    console.log(JSON.stringify(content.types, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkApprovalStatus();
