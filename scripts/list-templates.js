const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

client.content.v1.contents.list()
  .then(contents => {
    console.log('📋 Templates disponibles:\n');
    contents.forEach(c => {
      console.log(`Nombre: ${c.friendlyName}`);
      console.log(`  SID: ${c.sid}`);
      console.log(`  Fecha creación: ${c.dateCreated}`);
      console.log(`  Lenguaje: ${c.language}`);
      console.log('');
    });
  })
  .catch(e => console.error('Error:', e));
