# Sistema de Medicamentos y Notificaciones WhatsApp

## Características Implementadas

### ✅ UI/UX Mejorado
- **Header con gradiente vibrante** (indigo → purple → pink)
- **5 métricas visuales** con gradientes y animaciones:
  - Adherencia (%)
  - Dosis atrasadas
  - Dosis urgentes
  - Dosis próximas  
  - Dosis programadas
- **Dos vistas principales**:
  - Medicamentos Activos: Muestra TODOS los medicamentos de recetas activas
  - Próximas Dosis: Calendario de dosis con sistema de filtros
- **Tarjetas con estados visuales**: Colores diferenciados por urgencia
- **Barra de progreso de adherencia**: Indicador visual de cumplimiento

### ✅ Sistema de Alertas WhatsApp
- **Panel de configuración integrado** en la página de medicamentos
- **Toggle on/off** para activar/desactivar notificaciones
- **Indicadores visuales** del estado de las notificaciones
- **Validación automática** del número de teléfono

### ✅ Integración Completa

#### 1. Cuando se sube una receta:
```typescript
// lib/actions/prescriptions.actions.ts

1. Se guardan los medicamentos en la BD
2. Se generan las dosis programadas (medication_doses)
3. Se crean alertas automáticas en la app
4. Si el usuario tiene WhatsApp habilitado:
   ✅ Se envía notificación inmediata al registrar la receta
   ✅ Se programa envío de recordatorios para cada dosis
```

#### 2. Sistema de notificaciones automatizado:
```typescript
// lib/alerts-cron.ts

Cron Job (se ejecuta cada hora vía /api/cron/alerts):
- Busca dosis en la próxima hora
- Envía recordatorios por WhatsApp (1h antes)
- Crea alertas en la aplicación
- Verifica documentos próximos a vencer
```

#### 3. Templates de WhatsApp configurados:
```typescript
MEDICATION_REMINDER: 'HX7a90a5d7840f9e6139f1efbd526700d3'
WELCOME_VERIFICATION: 'HXed4dad300cdd95154003a6998b0d4d1f'
```

## Configuración Requerida

### 1. Variables de Entorno (.env.local)
```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

### 2. Configurar Cron Job en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Cron Jobs
3. Agrega un nuevo cron job:
   ```
   Path: /api/cron/alerts
   Schedule: 0 * * * * (cada hora)
   ```

### 3. Configurar número de WhatsApp del usuario

Los usuarios deben:
1. Ir a Dashboard → Settings (Configuración)
2. Agregar su número de teléfono con código de país: `+521234567890`
3. Activar "Notificaciones por WhatsApp"

## Flujo Completo de Uso

### Paso 1: Usuario sube receta
```
Dashboard → Prescriptions → Nueva Receta
- Subir imagen de receta
- IA detecta medicamentos
- Confirmar y guardar
```

### Paso 2: Sistema procesa
```
✅ Medicamentos guardados en BD
✅ Dosis programadas generadas
✅ Alertas creadas automáticamente
✅ Si WhatsApp está habilitado:
   📱 Notificación inmediata enviada
   📱 Recordatorios programados
```

### Paso 3: Usuario ve medicamentos
```
Dashboard → Medicamentos
- Ver todos los medicamentos activos
- Ver próximas dosis con filtros
- Ver estado de notificaciones WhatsApp
- Activar/desactivar notificaciones
```

### Paso 4: Recordatorios automáticos
```
Cron job (cada hora):
- Busca dosis en próxima hora
- Envía notificación WhatsApp 1h antes
- Crea alerta en la app
```

## Métricas Visuales Disponibles

### 1. Adherencia (%)
Porcentaje de dosis tomadas a tiempo vs total programado

### 2. Dosis Atrasadas
Dosis con más de 1 hora de retraso

### 3. Dosis Urgentes
Dosis en la próxima hora (incluye hasta 1h de retraso)

### 4. Dosis Próximas
Dosis en las próximas 2 horas

### 5. Dosis Programadas
Dosis futuras (más de 2h adelante)

## API Endpoints

### GET /api/cron/alerts
Ejecuta verificación de alertas y envía notificaciones WhatsApp
```bash
curl https://tu-app.vercel.app/api/cron/alerts?task=check
```

### POST /api/medications/reminder
Envía recordatorio manual de medicamento
```json
{
  "userId": "uuid",
  "doseId": "uuid"
}
```

## Estructura de Base de Datos

### Tablas Principales

```sql
-- Recetas
prescriptions (
  id, user_id, diagnosis, doctor_name, 
  start_date, end_date, notes
)

-- Medicamentos de cada receta
prescription_medicines (
  id, prescription_id, medicine_name, 
  dosage, frequency_hours, instructions
)

-- Dosis programadas
medication_doses (
  id, user_id, prescription_medicine_id,
  scheduled_at, status, taken_at
)

-- Alertas de la app
custom_alerts (
  id, user_id, type, title, 
  message, trigger_date, is_read
)

-- Perfil con WhatsApp
profiles (
  id, phone_number, 
  whatsapp_notifications_enabled
)
```

## Troubleshooting

### Las notificaciones de WhatsApp no llegan

1. **Verificar número de teléfono**:
   - Debe incluir código de país (+52 para México)
   - Formato: +521234567890

2. **Verificar configuración en perfil**:
   - Switch "Notificaciones WhatsApp" debe estar activado
   - Número debe estar guardado

3. **Verificar templates en Twilio**:
   - Deben estar aprobados (status: approved)
   - Usar los SIDs correctos en el código

4. **Verificar cron job**:
   - Debe estar configurado en Vercel
   - Ejecutar manualmente: `curl /api/cron/alerts?task=check`

### Los medicamentos no aparecen

1. **Verificar que la receta se guardó**:
   - Ir a Dashboard → Prescriptions
   - Debería aparecer listada

2. **Verificar fechas**:
   - La receta debe tener fecha de inicio
   - No debe estar finalizada (end_date)

3. **Revisar consola del navegador**:
   - Buscar errores de consulta
   - Verificar que `getActiveMedications()` devuelve datos

### Las dosis no se muestran

1. **Verificar que se generaron dosis**:
   ```sql
   SELECT * FROM medication_doses 
   WHERE user_id = 'tu-user-id' 
   ORDER BY scheduled_at DESC;
   ```

2. **Verificar rango de fechas**:
   - La query busca desde 24h atrás
   - Hasta 50 dosis futuras

3. **Verificar estado**:
   - Solo muestra status: 'scheduled' o 'pending'
   - Las tomadas (status: 'taken') no aparecen

## Mejoras Futuras

- [ ] Template específico de WhatsApp para documentos
- [ ] Estadísticas de adherencia históricas
- [ ] Gráficas de cumplimiento
- [ ] Exportar reporte de medicamentos en PDF
- [ ] Recordatorios por email como alternativa
- [ ] Integración con Apple Health / Google Fit
- [ ] Modo oscuro optimizado para las tarjetas
- [ ] Animaciones de transición entre vistas
