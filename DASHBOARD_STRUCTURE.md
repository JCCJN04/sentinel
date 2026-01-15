# Dashboard de Pacientes - Estructura Actualizada

## 🎯 Cambios Principales

### Separación de Secciones
Anteriormente, toda la información de doctores estaba mezclada en el dashboard principal. Ahora:

**✅ Dashboard Principal** (`/dashboard`)
- Estadísticas generales
- Acciones rápidas
- Documentos recientes
- Medicamentos próximos
- **LIMPIO Y ENFOCADO** - Sin información de doctores

**✅ Sección de Doctores** (`/dashboard/doctores`)
- Invitaciones pendientes
- Lista de doctores activos
- Gestión de accesos
- Compartir información
- **SEPARADO Y ORGANIZADO**

## 📍 Nueva Estructura de Navegación

### Menú Lateral Actualizado
```
Dashboard                    → /dashboard
Subir documento             → /dashboard/subir
Documentos                  → /dashboard/documentos
Recetas                     → /dashboard/prescriptions
Medicamentos                → /dashboard/medicamentos
Alergias                    → /dashboard/alergias
Vacunas                     → /dashboard/vacunas
Antecedentes               → /dashboard/antecedentes
Reportes                    → /dashboard/reportes
🆕 Mis Doctores            → /dashboard/doctores            ⭐ NUEVO
Compartir                   → /dashboard/compartidos
Familia                     → /dashboard/familia
Asistente IA               → /dashboard/asistente-ia
Configuración              → /dashboard/configuracion
```

## 🩺 Sección "Mis Doctores" (`/dashboard/doctores`)

### Componentes Visibles

#### 1. **Header con Contexto**
```
🩺 Mis Doctores
Gestiona los doctores que tienen acceso a tu expediente médico
```

#### 2. **Alert Informativo**
```
ℹ️ Los doctores que aparecen aquí tienen acceso a tu información médica 
porque aceptaste su invitación. Puedes compartir documentos específicos 
con ellos o revocar su acceso en cualquier momento.
```

#### 3. **Invitaciones Pendientes** (si hay)
Tarjetas con:
- Nombre del doctor
- Especialidad y cédula
- Mensaje de invitación
- Fecha de envío
- Botones: "Aceptar" / "Rechazar"

#### 4. **Doctores Activos**
Tarjetas expandidas con:
- Nombre completo (Dr. XXX)
- Especialidad
- Cédula profesional
- Teléfono
- Badge "Acceso activo"
- Fecha de acceso inicial
- Última consulta (si aplica)
- **Botones de Acción:**
  - 🔗 **"Compartir información"** → Va a página dedicada
  - 🚫 **"Revocar acceso"** → Dialog de confirmación

#### 5. **Estado Vacío** (sin doctores ni invitaciones)
```
No tienes doctores registrados

Cuando un doctor te envíe una invitación, aparecerá aquí 
para que puedas aceptarla o rechazarla.

[Icono grande de estetoscopio]
Aún no has recibido invitaciones de doctores
```

## 📤 Compartir Información con Doctor

### Ruta: `/dashboard/doctores/[id]/compartir`

#### Secciones de la Página:

**1. Breadcrumb**
```
← Volver a Mis Doctores
```

**2. Header**
```
🔗 Compartir Información Médica
Gestiona qué información puede ver Dr. [Nombre]
```

**3. Alert Informativo**
```
ℹ️ Puedes compartir diferentes tipos de información médica con tus doctores.
Tienes control total sobre qué pueden ver y puedes revocar el acceso en cualquier momento.
```

**4. Información del Doctor**
Card con:
- Nombre completo
- Especialidad
- Cédula profesional

**5. Recursos Actualmente Compartidos**
Lista de recursos con:
- Icono y nombre del tipo de recurso
- Badge "Activo"
- Fecha de compartición
- Notas (si hay)
- Fecha de expiración (si aplica)
- Botón 🗑️ para revocar

**6. Formulario para Compartir Nuevos Recursos**
Card con checkboxes:
```
☐ 📄 Todos los Documentos
   Acceso completo a todos tus documentos médicos

☐ 📋 Todas las Recetas
   Acceso a todas tus recetas médicas

☐ 💊 Todos los Medicamentos
   Lista completa de medicamentos que tomas

☐ 🛡️ Todas las Alergias
   Historial completo de alergias

☐ 💉 Todas las Vacunas
   Registro completo de vacunación

☐ 📊 Todos los Antecedentes
   Antecedentes médicos familiares y personales

☐ 📈 Todos los Reportes
   Reportes y análisis médicos
```

Campo de notas (opcional):
```
Notas (opcional)
[Agrega cualquier nota o instrucción para el doctor...]
```

Botón:
```
[Compartir Recursos Seleccionados]
```

## 🔄 Flujos Completos

### Flujo 1: Aceptar Invitación y Compartir
1. Paciente recibe invitación de doctor
2. Va a `/dashboard/doctores`
3. Ve la invitación pendiente
4. Click "Aceptar"
5. Doctor aparece en lista de activos
6. Click "Compartir información"
7. Selecciona tipos de recursos
8. Agrega nota opcional
9. Click "Compartir"
10. Ve confirmación
11. Recursos aparecen en lista "Compartidos"

### Flujo 2: Revocar Acceso a Recurso Específico
1. Va a `/dashboard/doctores`
2. Click "Compartir información" en doctor
3. En lista de "Recursos Compartidos"
4. Click 🗑️ en recurso específico
5. Confirma en dialog
6. Recurso desaparece de lista
7. Doctor pierde acceso inmediatamente

### Flujo 3: Revocar Acceso Completo
1. Va a `/dashboard/doctores`
2. Click "Revocar acceso" en tarjeta de doctor
3. Dialog de confirmación:
   ```
   ¿Revocar acceso al doctor?
   
   Al revocar el acceso, el Dr. [Nombre] ya no podrá ver 
   tu expediente médico ni documentos compartidos.
   Esta acción se puede revertir aceptando una nueva invitación.
   
   [Cancelar]  [Revocar acceso]
   ```
4. Confirma
5. Doctor pasa a estado "inactive"
6. Pierde todo acceso
7. Puede recibir nueva invitación después

## 🎨 Componentes UI Reutilizables

### `<DoctorInvitations />`
- Props: `invitations[]`
- Muestra tarjetas de invitaciones pendientes
- Actions: accept, reject
- Server actions en `/app/dashboard/invitations/actions.ts`

### `<PatientDoctors />`
- Props: `doctors[]`
- Muestra lista de doctores activos
- Botones: compartir, revocar
- Server action en `/app/dashboard/doctors/actions.ts`

### `<ShareResourcesForm />`
- Props: `doctorId`, `doctorName`, `currentShares[]`
- Checkboxes para tipos de recursos
- Campo de notas
- Server action en `/app/dashboard/compartir/actions.ts`

### `<SharedResourcesList />`
- Props: `doctorName`, `shares[]`
- Lista recursos compartidos
- Botón revocar por recurso
- Confirmación antes de revocar

## 📊 Estados de la UI

### Loading States
```typescript
[isLoading ? <Loader2 className="animate-spin" /> : "Texto"]
```

### Empty States
- Sin doctores ni invitaciones
- Sin recursos compartidos
- Doctor no encontrado

### Error States
```tsx
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Success States
```typescript
toast.success("Recursos compartidos con Dr. [Nombre]")
toast.success("Acceso revocado: [Recurso]")
```

## 🔑 Permisos y Acceso

### Nivel Paciente
- ✅ Ver sus propias invitaciones
- ✅ Aceptar/rechazar invitaciones
- ✅ Ver sus doctores activos
- ✅ Compartir recursos con doctores
- ✅ Revocar recursos compartidos
- ✅ Revocar acceso completo a doctor

### Nivel Doctor
- ✅ Enviar invitaciones a pacientes
- ✅ Ver sus invitaciones enviadas
- ✅ Ver solo recursos compartidos con él
- ❌ No puede ver otros doctores del paciente
- ❌ No puede revocar su propio acceso

## 📱 Responsive Design

### Desktop
- Grid de 2-3 columnas para tarjetas
- Sidebar visible permanentemente
- Formularios de ancho medio

### Tablet
- Grid de 2 columnas
- Sidebar colapsable

### Mobile
- Stack vertical
- Tarjetas de ancho completo
- Botones de ancho completo
- Menú hamburguesa

## 🎯 Ventajas de la Nueva Estructura

### Para el Usuario
✅ Menos desorden visual en dashboard
✅ Sección dedicada fácil de encontrar
✅ Flujos claros y enfocados
✅ Control granular sobre recursos compartidos

### Para el Desarrollo
✅ Separación de responsabilidades
✅ Componentes reutilizables
✅ Server actions bien organizados
✅ Fácil de mantener y extender

### Para el Rendimiento
✅ Dashboard carga más rápido (menos queries)
✅ Lazy loading de secciones específicas
✅ Menos re-renders innecesarios
