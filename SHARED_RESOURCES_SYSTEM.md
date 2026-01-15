# Sistema de Compartir Recursos con Doctores

## 🎯 Objetivo
Permitir a los pacientes compartir diferentes tipos de información médica con sus doctores (no solo documentos), dándoles control total sobre qué información comparten.

## 📊 ¿Qué se puede compartir?

El sistema ahora soporta compartir:
1. **Todos los Documentos** - Acceso completo a documentos médicos
2. **Todas las Recetas** - Historial completo de recetas
3. **Todos los Medicamentos** - Lista de medicamentos activos
4. **Todas las Alergias** - Registro de alergias
5. **Todas las Vacunas** - Historial de vacunación
6. **Todos los Antecedentes** - Antecedentes médicos familiares/personales
7. **Todos los Reportes** - Reportes y análisis médicos

## 🗄️ Base de Datos

### Nueva Tabla: `shared_resources_with_doctor`
```sql
- id: UUID (PK)
- patient_id: UUID (FK a profiles)
- doctor_id: UUID (FK a doctor_profiles)
- resource_type: ENUM (tipo de recurso)
- resource_id: UUID (NULL para tipos "all_*")
- shared_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (opcional)
- notes: TEXT (opcional)
```

### Tipo ENUM: `resource_type`
Valores:
- Individuales: `document`, `prescription`, `medication`, `allergy`, `vaccine`, `antecedente`, `report`
- Colecciones: `all_documents`, `all_prescriptions`, `all_medications`, `all_allergies`, `all_vaccines`, `all_antecedentes`, `all_reports`

### Funciones de Base de Datos

#### `doctor_has_access_to_resource(doctor_id, patient_id, resource_type, resource_id)`
Verifica si un doctor tiene acceso a un recurso específico.
- Valida que la relación doctor-paciente esté activa
- Verifica acceso directo o acceso a "todos los recursos del tipo"
- Respeta fechas de expiración

#### `get_shared_resources_summary(doctor_id, patient_id)`
Retorna resumen de recursos compartidos con un doctor:
- Tipo de recurso
- Cantidad compartida
- Si tiene acceso a "todos" de ese tipo

## 📁 Archivos Creados/Modificados

### Migraciones
- `supabase/migrations/20260113_shared_resources.sql` - Schema de base de datos
- `MANUAL_MIGRATION_shared_resources.sql` - Script manual para ejecutar en Supabase

### Servicios (Backend)
- `lib/shared-resources-service.ts` - Lógica de negocio
  - `shareResourceWithDoctor()` - Compartir recurso
  - `getSharedResourcesWithDoctor()` - Obtener recursos compartidos
  - `getSharedResourcesSummary()` - Resumen de recursos compartidos
  - `revokeSharedResource()` - Revocar recurso específico
  - `revokeAllResourcesOfType()` - Revocar todos de un tipo
  - `checkDoctorAccess()` - Verificar acceso
  - `getDoctorsWithAccessToResource()` - Obtener doctores con acceso

### Server Actions
- `app/dashboard/compartir/actions.ts`
  - `shareResourceAction()`
  - `revokeResourceAction()`
  - `revokeAllResourcesAction()`

### Componentes UI
- `components/dashboard/share-resources-form.tsx`
  - Formulario con checkboxes para seleccionar recursos
  - Campo de notas opcional
  - Indicadores visuales de recursos ya compartidos
  - Validación de selección

- `components/dashboard/shared-resources-list.tsx`
  - Lista de recursos actualmente compartidos
  - Información detallada (fecha, notas, expiración)
  - Botón para revocar cada recurso
  - Confirmación antes de revocar

### Páginas
- `app/dashboard/doctores/[id]/compartir/page.tsx`
  - Página dedicada para compartir con un doctor específico
  - Muestra info del doctor
  - Lista recursos actuales
  - Formulario para agregar nuevos recursos

### Actualizaciones
- `components/dashboard/patient-doctors.tsx`
  - Botón "Compartir información" ahora va a `/dashboard/doctores/[id]/compartir`
  - Cambio de texto: "Compartir documento" → "Compartir información"

## 🔐 Seguridad

### Row Level Security (RLS)
- **Pacientes**: Pueden ver y gestionar sus propios recursos compartidos
- **Doctores**: Solo pueden ver recursos compartidos con ellos
- Todas las operaciones usan `service role key` para bypasear limitaciones de RLS con `auth.users`

### Validaciones
- Relación doctor-paciente debe estar activa
- No se permiten duplicados (UNIQUE constraint)
- Las fechas de expiración se respetan automáticamente
- Confirmación obligatoria antes de revocar acceso

## 🚀 Flujo de Usuario

### Para Pacientes:
1. Ir a "Mis Doctores" (`/dashboard/doctores`)
2. Click en "Compartir información" en la tarjeta del doctor
3. Seleccionar tipos de recursos a compartir (checkboxes)
4. Agregar notas opcionales
5. Click "Compartir Recursos Seleccionados"
6. Ver lista de recursos activos
7. Revocar acceso individual cuando sea necesario

### Para Doctores:
- Los doctores podrán ver solo los recursos compartidos con ellos
- El acceso se valida con la función `doctor_has_access_to_resource()`
- Si un paciente revoca acceso, el doctor pierde acceso inmediatamente

## 📋 Instrucciones de Instalación

### 1. Aplicar Migración de Base de Datos

**Opción A: Supabase CLI** (si está configurado)
```bash
supabase db push
```

**Opción B: SQL Editor (Recomendado)**
1. Ir a Supabase Dashboard
2. Abrir SQL Editor
3. Nueva Query
4. Copiar y pegar contenido de `MANUAL_MIGRATION_shared_resources.sql`
5. Ejecutar (Run)

### 2. Verificar Instalación
En SQL Editor, ejecutar:
```sql
-- Verificar que la tabla existe
SELECT * FROM shared_resources_with_doctor LIMIT 1;

-- Verificar que las funciones existen
SELECT proname FROM pg_proc WHERE proname IN ('doctor_has_access_to_resource', 'get_shared_resources_summary');
```

## 🧪 Testing

### Escenario de Prueba:
1. Login como paciente
2. Ir a `/dashboard/doctores`
3. Aceptar invitación de doctor (si hay pendientes)
4. Click "Compartir información" en un doctor
5. Seleccionar varios tipos de recursos
6. Agregar nota: "Acceso completo para diagnóstico"
7. Compartir
8. Verificar que aparecen en la lista
9. Revocar uno de los recursos
10. Confirmar que desaparece

### Validaciones:
- ✅ No se pueden crear duplicados
- ✅ Solo paciente puede compartir/revocar
- ✅ Doctor solo ve sus recursos compartidos
- ✅ Fechas de expiración se respetan
- ✅ Confirmación antes de revocar

## 🔮 Próximas Mejoras

1. **Recursos Individuales**
   - Compartir documentos específicos (no todos)
   - Compartir recetas individuales
   - UI para seleccionar recursos específicos

2. **Expiración Automática**
   - UI para establecer fecha de expiración
   - Job programado para limpiar accesos expirados
   - Notificación antes de expirar

3. **Notificaciones**
   - Email cuando se comparte nuevo recurso
   - Email cuando se revoca acceso
   - Notificación en app para doctor

4. **Auditoría**
   - Log de quién vio qué y cuándo
   - Historial de cambios de permisos
   - Reportes de acceso

5. **Permisos Granulares**
   - Solo lectura vs descarga
   - Restricciones por fecha (ej: solo últimos 6 meses)
   - Acceso temporal automatizado

## 📝 Notas Técnicas

- Usa `service role key` para bypasear RLS en operaciones complejas
- Las funciones de BD tienen `SECURITY DEFINER` para permisos elevados
- Los índices optimizan queries por patient_id, doctor_id y resource_type
- El constraint UNIQUE previene duplicados pero permite múltiples estados
- La cascada DELETE asegura limpieza automática si se elimina paciente/doctor
