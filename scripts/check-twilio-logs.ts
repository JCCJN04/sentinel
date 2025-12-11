/**
 * Script para verificar los logs de mensajes en Twilio
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Leer .env.local
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

async function checkMessageLogs() {
  console.log('\n📊 === VERIFICANDO LOGS DE MENSAJES TWILIO ===\n')

  try {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
    
    // Obtener los últimos 5 mensajes
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json?PageSize=5`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      console.log('❌ Error al obtener logs:', error)
      return
    }

    const data = await response.json()
    
    if (!data.messages || data.messages.length === 0) {
      console.log('⚠️  No se encontraron mensajes recientes')
      return
    }

    console.log(`📬 Últimos ${data.messages.length} mensajes:\n`)
    
    for (const msg of data.messages) {
      console.log('─────────────────────────────────────────────')
      console.log(`📱 SID: ${msg.sid}`)
      console.log(`📤 De: ${msg.from}`)
      console.log(`📥 Para: ${msg.to}`)
      console.log(`📝 Mensaje: ${msg.body?.substring(0, 100)}...`)
      console.log(`📊 Estado: ${getStatusIcon(msg.status)} ${msg.status.toUpperCase()}`)
      console.log(`💰 Precio: ${msg.price || '0'} ${msg.price_unit || 'USD'}`)
      console.log(`🕐 Enviado: ${new Date(msg.date_sent).toLocaleString('es-MX')}`)
      
      if (msg.error_code) {
        console.log(`❌ Error Code: ${msg.error_code}`)
        console.log(`❌ Error: ${msg.error_message}`)
      }
      
      console.log('')
    }

    console.log('─────────────────────────────────────────────\n')
    
    // Verificar estados
    const failed = data.messages.filter((m: any) => m.status === 'failed' || m.status === 'undelivered')
    const pending = data.messages.filter((m: any) => m.status === 'queued' || m.status === 'sending')
    const delivered = data.messages.filter((m: any) => m.status === 'delivered' || m.status === 'sent')
    
    console.log('📈 Resumen:')
    console.log(`   ✅ Entregados: ${delivered.length}`)
    console.log(`   ⏳ Pendientes: ${pending.length}`)
    console.log(`   ❌ Fallidos: ${failed.length}\n`)

    if (failed.length > 0) {
      console.log('🔍 Mensajes fallidos:')
      failed.forEach((msg: any) => {
        console.log(`   • ${msg.sid}: ${msg.error_message || 'Error desconocido'}`)
      })
      console.log('')
    }

    console.log('🌐 Ver más detalles en:')
    console.log(`   https://console.twilio.com/us1/monitor/logs/messaging\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'queued': '⏳',
    'sending': '📤',
    'sent': '✅',
    'delivered': '✅',
    'undelivered': '❌',
    'failed': '❌',
    'received': '📥'
  }
  return icons[status] || '❓'
}

checkMessageLogs()
