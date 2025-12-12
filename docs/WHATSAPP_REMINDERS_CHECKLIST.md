# 📋 CHECKLIST: Sistema de Recordatorios de Medicamentos por WhatsApp

## ✅ Pre-requisitos

- [ ] Cuenta de Supabase (plan Pro recomendado para pg_cron)
- [ ] Cuenta de Twilio con WhatsApp habilitado
- [ ] Template de Twilio aprobado: `medication_reminder` (HX7a90a5d7840f9e6139f1efbd526700d3)
- [ ] Supabase CLI instalado (`npm install -g supabase`)

---

## 🗄️ Fase 1: Migración de Base de Datos

### 1.1 Ejecutar migración principal

```bash
# Opción A: Usar Supabase CLI
supabase db push

# Opción B: Ejecutar en SQL Editor del Dashboard
# Copiar contenido de supabase/migrations/001_whatsapp_notifications.sql
```

### Verificar:

- [ ] Tabla `whatsapp_notifications` creada
- [ ] Tabla `whatsapp_notification_logs` creada
- [ ] Columna `whatsapp_enabled` en `profiles`
- [ ] Columna `first_dose_time` en `prescription_medicines`
- [ ] Columna `reminder_enabled` en `prescription_medicines`
- [ ] Índices creados correctamente
- [ ] RLS habilitado en nuevas tablas
- [ ] Trigger `auto_generate_notifications` activo

### SQL de verificación:

```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('whatsapp_notifications', 'whatsapp_notification_logs');

-- Verificar columnas en profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'whatsapp_enabled';

-- Verificar trigger
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'auto_generate_notifications';
```

---

## ⚙️ Fase 2: Configurar Edge Function

### 2.1 Desplegar función

```bash
# Desde la raíz del proyecto
supabase functions deploy send-medication-reminders
```

### 2.2 Configurar secrets

```bash
# Twilio
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_WHATSAPP_NUMBER=+19786969677
```

### Verificar:

- [ ] Función desplegada sin errores
- [ ] Secrets configurados
- [ ] Función visible en Dashboard > Edge Functions

### Test manual:

```bash
# Probar función localmente
supabase functions serve send-medication-reminders

# En otra terminal
curl -X POST http://localhost:54321/functions/v1/send-medication-reminders \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "test"}'
```

---

## ⏱️ Fase 3: Configurar pg_cron

### 3.1 Habilitar extensiones

En Dashboard > Database > Extensions:

- [ ] `pg_cron` habilitado
- [ ] `pg_net` habilitado

### 3.2 Configurar variables de base de datos

```sql
-- En SQL Editor
ALTER DATABASE postgres SET app.supabase_url = 'https://TU_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'eyJ...TU_SERVICE_ROLE_KEY...';
```

### 3.3 Ejecutar migración de cron

```sql
-- Copiar contenido de supabase/migrations/002_pg_cron_setup.sql
```

### Verificar:

- [ ] Job `send-medication-reminders` creado
- [ ] Job `cleanup-whatsapp-notifications` creado

```sql
-- Ver jobs activos
SELECT * FROM cron.job;

-- Ver últimas ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 🧪 Fase 4: Testing End-to-End

### 4.1 Crear datos de prueba

```sql
-- 1. Asegurar que un usuario tiene WhatsApp habilitado
UPDATE profiles 
SET whatsapp_enabled = true, 
    phone = '+528111230266' -- Tu número de prueba
WHERE id = 'TU_USER_ID';

-- 2. Crear una prescripción de prueba
INSERT INTO prescriptions (id, user_id, diagnosis, start_date, end_date)
VALUES (
  gen_random_uuid(),
  'TU_USER_ID',
  'Prueba de sistema',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);

-- 3. Crear medicamento (obtener prescription_id del paso anterior)
INSERT INTO prescription_medicines (id, prescription_id, medicine_name, dosage, frequency_hours, first_dose_time)
VALUES (
  gen_random_uuid(),
  'PRESCRIPTION_ID',
  'Ibuprofeno',
  '400mg',
  8, -- cada 8 horas
  '08:00:00'
);

-- 4. Crear dosis de prueba (en 2 minutos desde ahora)
INSERT INTO medication_doses (user_id, prescription_medicine_id, scheduled_at)
VALUES (
  'TU_USER_ID',
  'PRESCRIPTION_MEDICINE_ID',
  now() + INTERVAL '2 minutes'
);
```

### 4.2 Verificar que se generaron notificaciones

```sql
SELECT * FROM whatsapp_notifications ORDER BY created_at DESC LIMIT 10;
```

Deberías ver 2 notificaciones:
- `reminder_5min` (5 minutos antes)
- `reminder_exact` (a la hora exacta)

### 4.3 Esperar y verificar envío

Espera a que el cron ejecute (cada minuto) y verifica:

```sql
-- Ver estado de notificaciones
SELECT id, notification_type, scheduled_at, status, sent_at, twilio_message_sid
FROM whatsapp_notifications 
ORDER BY created_at DESC LIMIT 10;

-- Ver logs de envío
SELECT * FROM whatsapp_notification_logs ORDER BY created_at DESC LIMIT 10;

-- Ver ejecuciones del cron
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-medication-reminders' 
ORDER BY start_time DESC LIMIT 5;
```

### 4.4 Verificar mensaje en WhatsApp

- [ ] Mensaje recibido en el teléfono de prueba
- [ ] Template renderizado correctamente con nombre, medicamento, dosis y hora

---

## 🔧 Troubleshooting

### El cron no ejecuta

```sql
-- Verificar que el job existe
SELECT * FROM cron.job WHERE jobname = 'send-medication-reminders';

-- Verificar errores en ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-medication-reminders' 
ORDER BY start_time DESC LIMIT 5;
```

### La Edge Function falla

1. Ver logs en Dashboard > Edge Functions > Logs
2. Verificar que los secrets están configurados
3. Probar localmente con `supabase functions serve`

### No se generan notificaciones

```sql
-- Verificar que el trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'auto_generate_notifications';

-- Verificar que el usuario tiene WhatsApp habilitado
SELECT id, first_name, phone, whatsapp_enabled FROM profiles WHERE id = 'USER_ID';

-- Generar manualmente
SELECT generate_medication_notifications('DOSE_ID');
```

### Twilio devuelve error

- **21608**: Número no registrado en sandbox. El usuario debe enviar "join stage-special" al número de sandbox.
- **63016**: Template no aprobado. Verificar en Twilio Console.
- **21211**: Número de destino inválido. Verificar formato +52XXXXXXXXXX.

---

## 📊 Monitoreo en Producción

### Dashboard SQL queries:

```sql
-- Estadísticas de hoy
SELECT 
  status,
  COUNT(*) as total,
  MIN(scheduled_at) as primera,
  MAX(scheduled_at) as ultima
FROM whatsapp_notifications
WHERE created_at::date = CURRENT_DATE
GROUP BY status;

-- Tasa de éxito últimos 7 días
SELECT 
  DATE(created_at) as fecha,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as tasa_exito,
  COUNT(*) as total
FROM whatsapp_notification_logs
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- Usuarios con más fallos
SELECT 
  p.first_name,
  p.phone,
  COUNT(*) as fallos
FROM whatsapp_notification_logs l
JOIN profiles p ON p.id = l.user_id
WHERE l.success = false AND l.created_at > now() - INTERVAL '7 days'
GROUP BY p.id, p.first_name, p.phone
ORDER BY fallos DESC
LIMIT 10;
```

---

## ✅ Checklist Final

- [ ] Migración de DB ejecutada
- [ ] Edge Function desplegada
- [ ] Secrets de Twilio configurados
- [ ] pg_cron habilitado y job creado
- [ ] Test end-to-end exitoso
- [ ] Mensaje de WhatsApp recibido
- [ ] Monitoreo configurado

---

## 📁 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/001_whatsapp_notifications.sql` | Tablas, índices, RLS, triggers |
| `supabase/migrations/002_pg_cron_setup.sql` | Configuración de pg_cron |
| `supabase/functions/send-medication-reminders/index.ts` | Edge Function principal |
| `supabase/functions/.env.example` | Variables de entorno |
| `docs/WHATSAPP_REMINDERS_CHECKLIST.md` | Este archivo |
