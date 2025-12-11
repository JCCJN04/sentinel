/**
 * Script de prueba para verificar la configuración de Twilio WhatsApp
 * Ejecutar: npx tsx scripts/test-twilio-config.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Leer .env.local manualmente
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
  } catch (error) {
    console.error('Error leyendo .env.local:', error)
  }
}

loadEnv()

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER

console.log('\n🔍 === VERIFICACIÓN DE CONFIGURACIÓN TWILIO ===\n')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log(`   TWILIO_ACCOUNT_SID: ${ACCOUNT_SID ? '✅ Configurado' : '❌ Falta'}`)
console.log(`   TWILIO_AUTH_TOKEN: ${AUTH_TOKEN ? '✅ Configurado' : '❌ Falta'}`)
console.log(`   TWILIO_WHATSAPP_NUMBER: ${WHATSAPP_NUMBER ? '✅ Configurado' : '❌ Falta'}`)

if (!ACCOUNT_SID || !AUTH_TOKEN || !WHATSAPP_NUMBER) {
  console.log('\n❌ Error: Faltan variables de entorno')
  console.log('📝 Edita el archivo .env.local y agrega tus credenciales de Twilio\n')
  process.exit(1)
}

// Verificar formato
console.log('\n🔍 Verificación de formato:')

if (!ACCOUNT_SID.startsWith('AC')) {
  console.log(`   ⚠️  Account SID debería empezar con 'AC' (actual: ${ACCOUNT_SID.substring(0, 2)})`)
} else {
  console.log(`   ✅ Account SID formato correcto (${ACCOUNT_SID.substring(0, 10)}...)`)
}

if (AUTH_TOKEN.length < 30) {
  console.log('   ⚠️  Auth Token parece muy corto')
} else {
  console.log(`   ✅ Auth Token configurado (${AUTH_TOKEN.substring(0, 4)}...${AUTH_TOKEN.substring(AUTH_TOKEN.length - 4)})`)
}

if (!WHATSAPP_NUMBER.startsWith('whatsapp:+')) {
  console.log(`   ⚠️  WhatsApp Number debe empezar con 'whatsapp:+' (actual: ${WHATSAPP_NUMBER})`)
  console.log('      Formato correcto: whatsapp:+19786969677')
} else {
  console.log(`   ✅ WhatsApp Number formato correcto (${WHATSAPP_NUMBER})`)
}

// Probar conexión con Twilio API
async function testTwilioConnection() {
  console.log('\n🌐 Probando conexión con Twilio API...')
  
  try {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Conexión exitosa con Twilio')
      console.log(`   📊 Cuenta: ${data.friendly_name}`)
      console.log(`   💰 Status: ${data.status}`)
      console.log(`   📅 Creada: ${new Date(data.date_created).toLocaleDateString()}`)
      return true
    } else {
      const error = await response.json()
      console.log('   ❌ Error de autenticación:')
      console.log(`      ${error.message || error.error}`)
      console.log('   💡 Verifica que tu Account SID y Auth Token sean correctos')
      return false
    }
  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message)
    return false
  }
}

// Verificar saldo
async function checkBalance() {
  console.log('\n💰 Verificando saldo...')
  
  try {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Balance.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      const balance = parseFloat(data.balance)
      console.log(`   💵 Saldo actual: $${Math.abs(balance).toFixed(2)} USD`)
      console.log(`   📊 Moneda: ${data.currency}`)
      
      if (Math.abs(balance) < 1) {
        console.log('   ⚠️  Saldo bajo, considera recargar tu cuenta')
      }
      return true
    } else {
      console.log('   ⚠️  No se pudo obtener el saldo')
      return false
    }
  } catch (error) {
    console.log('   ⚠️  Error al verificar saldo:', error.message)
    return false
  }
}

// Ejecutar pruebas
async function runTests() {
  const connectionOk = await testTwilioConnection()
  
  if (connectionOk) {
    await checkBalance()
    
    console.log('\n📱 Siguiente paso: Enviar mensaje de prueba')
    console.log('   Para enviar un mensaje de prueba, ejecuta:')
    console.log('   npx tsx scripts/test-whatsapp.ts\n')
    console.log('✅ Configuración verificada exitosamente!\n')
  } else {
    console.log('\n❌ La configuración tiene problemas.')
    console.log('📝 Revisa tus credenciales en .env.local\n')
    process.exit(1)
  }
}

runTests()
