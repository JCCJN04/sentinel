# 🏥 HealthPal - Configuración del Proyecto Nuevo

Este documento te guía para configurar tu nuevo proyecto de Supabase desde cero.

## 📋 Prerequisitos

1. ✅ Proyecto nuevo de Supabase creado
2. ✅ Archivo `backup_supabase.sql` o `complete-schema-backup.sql` ejecutado
3. ✅ Variables de entorno configuradas en `.env.local`

## 🚀 Configuración Inicial

### Paso 1: Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga estas variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Gemini (para asistente médico)
GEMINI_API_KEY=tu_gemini_api_key
```

### Paso 2: Ejecutar Script de Configuración

Este script verificará tu base de datos y te mostrará cómo configurar el storage bucket:

```bash
npm run setup
```

El script:
- ✅ Verifica la conexión a la base de datos
- ✅ Crea el bucket "documents" (si no existe)
- ✅ Te muestra el SQL para configurar las políticas RLS
- ✅ Verifica la configuración de Twilio

### Paso 3: Configurar Políticas de Storage (RLS)

1. Ve a tu Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia y ejecuta el SQL que el script te mostró (políticas de RLS)

**SQL de ejemplo:**
```sql
-- Política para LECTURA
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para SUBIDA
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- (... más políticas mostradas por el script)
```

### Paso 4: Configurar WhatsApp Templates

Si aún no tienes los templates de Twilio aprobados:

```bash
npm run create-templates
```

Esto creará 2 templates:
1. **Bienvenida y Verificación** - Mensaje de bienvenida
2. **Recordatorio de Medicamento** - Alertas de medicamentos

⚠️ **Importante:** Los templates necesitan aprobación de WhatsApp (24-48 horas).

Mientras tanto, puedes usar el **Twilio Sandbox** para pruebas:
- Número: `whatsapp:+14155238886`
- Código: Envía "join [código]" al número

### Paso 5: Probar WhatsApp

Una vez que los templates estén aprobados (o usando el sandbox):

```bash
npm run test-whatsapp
```

Deberías recibir un mensaje de bienvenida en WhatsApp.

### Paso 6: Iniciar la Aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y regístrate.

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run setup` | **Configura el proyecto nuevo desde cero** |
| `npm run create-templates` | Crea los templates de WhatsApp en Twilio |
| `npm run test-whatsapp` | Envía un mensaje de prueba por WhatsApp |
| `npm run build` | Construye la app para producción |

## 📱 Funcionalidades de WhatsApp

El sistema solo envía **2 tipos de mensajes**:

### 1. Mensaje de Bienvenida
Se envía automáticamente cuando el usuario verifica su número de teléfono.

```
👋 Bienvenido a HealthPal

Hola {{nombre}},

Tu número ha sido verificado correctamente.

Gracias por usar HealthPal.
```

### 2. Recordatorio de Medicamento
Se envía cuando es hora de tomar un medicamento (según la receta).

```
🏥 Recordatorio de Medicamento

Hola {{nombre}},

Es hora de tomar tu medicamento:
💊 {{nombre_medicamento}}
📊 Dosis: {{dosis}}
⏰ Hora: {{hora}}

HealthPal - Tu asistente de salud
```

## 🗄️ Estructura del Storage

Los archivos se organizan así:

```
documents/
  └── {user_id}/
      ├── document_1.pdf
      ├── document_2.jpg
      └── ...
```

Cada usuario solo puede acceder a su propia carpeta gracias a las políticas RLS.

## ⚠️ Solución de Problemas

### Error: "Bucket does not exist"
- Ejecuta `npm run setup` nuevamente
- O créalo manualmente en Supabase Dashboard → Storage

### Error: "RLS policy denies request"
- Verifica que ejecutaste el SQL de políticas RLS
- Comprueba que el usuario esté autenticado

### Error: "Twilio authentication failed"
- Verifica tus credenciales en `.env.local`
- Comprueba que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` sean correctos

### No recibo mensajes de WhatsApp
- Verifica que los templates estén aprobados en Twilio
- Usa el sandbox de Twilio mientras esperas aprobación
- Comprueba que el número tenga formato correcto: `+52XXXXXXXXXX`

## 📚 Recursos

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Content Templates de Twilio](https://www.twilio.com/docs/content/content-types-overview)

## 🆘 Ayuda Adicional

Si tienes problemas:
1. Verifica los logs en la consola
2. Comprueba que todas las variables de entorno estén configuradas
3. Revisa que el bucket y las políticas RLS estén creados
4. Asegúrate de que los templates de Twilio estén aprobados

---

¡Listo! Tu proyecto HealthPal debería estar funcionando correctamente. 🎉
