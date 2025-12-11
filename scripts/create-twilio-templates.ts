/**
 * Script para crear Content Templates en Twilio automáticamente
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

// Plantillas a crear (SOLO las que necesitamos)
const templates = [
  {
    friendly_name: 'Recordatorio de Medicamento',
    language: 'es',
    types: {
      'twilio/text': {
        body: '🏥 *Recordatorio de Medicamento*\n\nHola {{1}},\n\nEs hora de tomar tu medicamento:\n💊 *{{2}}*\n📊 Dosis: {{3}}\n⏰ Hora: {{4}}\n\n_HealthPal - Tu asistente de salud_'
      }
    }
  },
  {
    friendly_name: 'Bienvenida y Verificación',
    language: 'es',
    types: {
      'twilio/text': {
        body: '👋 Bienvenido a HealthPal\n\nHola {{1}},\n\nTu número ha sido verificado correctamente.\n\nGracias por usar HealthPal.'
      }
    }
  }
]

async function createTemplate(template: any) {
  try {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
    
    const response = await fetch(
      `https://content.twilio.com/v1/Content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      }
    )

    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ Plantilla creada: ${template.friendly_name}`)
      console.log(`      SID: ${data.sid}`)
      return { success: true, data }
    } else {
      console.log(`   ❌ Error: ${data.message || 'Desconocido'}`)
      if (data.more_info) {
        console.log(`      Más info: ${data.more_info}`)
      }
      return { success: false, error: data }
    }
  } catch (error) {
    console.log(`   ❌ Error de red:`, error)
    return { success: false, error }
  }
}

async function createAllTemplates() {
  console.log('\n📝 === CREANDO CONTENT TEMPLATES EN TWILIO ===\n')
  console.log('⚠️  NOTA: Estas plantillas necesitan aprobación de WhatsApp.')
  console.log('   El proceso puede tomar 24-48 horas.\n')

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    console.log(`📄 [${i + 1}/${templates.length}] Creando: ${template.friendly_name}`)
    await createTemplate(template)
    console.log('')
  }

  console.log('─────────────────────────────────────────────')
  console.log('\n✅ Proceso completado!')
  console.log('\n📋 Siguiente paso:')
  console.log('   1. Ve a: https://console.twilio.com/us1/develop/sms/content-editor')
  console.log('   2. Revisa el estado de tus plantillas')
  console.log('   3. Espera la aprobación de WhatsApp (24-48h)\n')
  console.log('💡 Mientras tanto, usa el sandbox: whatsapp:+14155238886\n')
}

createAllTemplates()
