# Guía de Estilos y Buenas Prácticas - Sentinel

Esta guía establece los estándares de diseño y desarrollo para mantener la plataforma simple, consistente e intuitiva.

## 🎨 Principios de Diseño

### Simplicidad
- **Menos es más**: Mostrar solo la información esencial
- **Formularios concisos**: Solo campos necesarios, marcar opcionales claramente
- **Textos directos**: Evitar explicaciones largas, ir al grano

### Consistencia
- **Colores uniformes**: Usar la misma paleta en toda la plataforma
- **Componentes reutilizables**: EmptyState, LoadingState, ErrorState
- **Gradientes de marca**: from-blue-600 to-purple-600 para títulos principales

### Claridad
- **Lenguaje natural**: Usar "tú" en lugar de "usted"
- **Mensajes amigables**: "Bienvenido" en vez de "Inicio de sesión exitoso"
- **Iconos descriptivos**: Acompañar acciones con iconos intuitivos

## 📝 Convenciones de Texto

### Títulos
```tsx
// ✅ Correcto - Directo y con gradiente
<h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  Mi Expediente Médico
</h1>

// ❌ Evitar - Muy formal o largo
<h1>Bienvenido a tu Dashboard de Información Médica</h1>
```

### Descripciones
```tsx
// ✅ Correcto - Conciso
<p>Resumen de tu información de salud</p>

// ❌ Evitar - Explicativo innecesario
<p>Aquí puedes ver un resumen completo de toda tu información médica almacenada</p>
```

### Botones y Acciones
- "Subir" en lugar de "Subir Nuevo Documento"
- "Ver Documentos" en lugar de "Ver Todos los Documentos"
- "Guardar" en lugar de "Guardar Cambios"
- "Crear cuenta" en lugar de "Registrarse"

## 🎨 Paleta de Colores

### Colores de Estado
```tsx
// Éxito/Activo
emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" }

// Advertencia/Urgente
amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" }

// Error/Atrasado
red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }

// Información
blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" }

// Neutro
purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" }
sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" }
```

## 🧩 Componentes Estándar

### Estados Vacíos
```tsx
import { EmptyState } from "@/components/ui/empty-state"

<EmptyState
  icon={FileText}
  title="No hay documentos"
  description="Sube tu primer documento para comenzar"
  actionLabel="Subir documento"
  actionHref="/dashboard/subir"
/>
```

### Estados de Carga
```tsx
import { LoadingState } from "@/components/ui/loading-state"

<LoadingState message="Cargando documentos..." size="md" />
```

### Estados de Error
```tsx
import { ErrorState } from "@/components/ui/error-state"

<ErrorState
  title="Error al cargar"
  message="No se pudieron cargar los documentos"
  onRetry={fetchDocuments}
  retryLabel="Intentar nuevamente"
/>
```

## 📋 Formularios

### Estructura Simplificada
```tsx
// ✅ Solo campos esenciales visibles
<Form>
  <Input label="Nombre del Documento *" />
  <Select label="Categoría" />
  <Input label="Fecha" />
  <Textarea label="Notas (Opcional)" />
</Form>

// ❌ Evitar tabs con muchos campos opcionales
<Tabs>
  <Tab value="basic">20 campos</Tab>
  <Tab value="medical">15 campos</Tab>
  <Tab value="advanced">10 campos</Tab>
</Tabs>
```

### Labels y Placeholders
```tsx
// ✅ Correcto
<Label>Nombre del Documento *</Label>
<Input placeholder="Ej: Radiografía de Tórax" />

// ❌ Evitar
<Label>Ingrese el nombre descriptivo del documento médico</Label>
<Input placeholder="Por favor ingrese aquí el nombre..." />
```

## 🗺️ Navegación

### Orden Lógico del Menú
1. **Inicio**: Dashboard
2. **Acción Principal**: Subir documento
3. **Consulta**: Documentos, Alertas
4. **Salud**: Recetas, Medicamentos, Alergias, Vacunas
5. **Información**: Antecedentes, Reportes
6. **Colaboración**: Compartir, Familia
7. **Herramientas**: Asistente IA
8. **Configuración**: Última opción

### Acciones Rápidas
Máximo 5 acciones principales:
- Subir Documento
- Ver Documentos
- Medicamentos
- Alertas
- Compartir

## 💬 Mensajes al Usuario

### Toast Notifications
```tsx
// ✅ Correcto - Breve y claro
toast({
  title: "Documento subido",
  description: "El archivo se guardó correctamente"
})

// ❌ Evitar - Muy largo
toast({
  title: "¡Operación exitosa!",
  description: "El documento ha sido subido correctamente al sistema y ya está disponible en tu expediente"
})
```

### Mensajes de Error
```tsx
// ✅ Correcto - Específico y accionable
"No se pudo subir el archivo. Verifica tu conexión e intenta nuevamente"

// ❌ Evitar - Genérico o técnico
"Error 500: Internal Server Error en el endpoint /api/upload"
```

## 📱 Responsividad

### Breakpoints
```tsx
// Mobile first
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Ocultar en móvil
className="hidden md:block"

// Mostrar solo en móvil
className="block md:hidden"
```

### Espaciado
```tsx
// Container
className="container mx-auto p-4 md:p-8"

// Grid gaps
className="grid gap-4 md:gap-8"

// Títulos responsive
className="text-2xl md:text-3xl lg:text-4xl"
```

## ✨ Animaciones

### Entrance Animations
```tsx
className="animate-in fade-in slide-in-from-top-4 duration-500"
```

### Hover Effects
```tsx
className="hover:shadow-lg hover:scale-105 transition-all duration-300"
```

### Delays Progresivos
```tsx
style={{ animationDelay: `${idx * 50}ms` }}
```

## 🚫 Anti-Patrones a Evitar

1. **Formularios complejos**: Evitar tabs con muchos campos opcionales
2. **Texto verbose**: No explicar lo obvio
3. **Formalidad excesiva**: Usar "usted", "por favor ingrese"
4. **Redundancia**: "Subir Nuevo Documento" → "Subir Documento"
5. **Colores inconsistentes**: Usar siempre la paleta definida
6. **Estados sin feedback**: Siempre mostrar loading/error/empty states

## 📦 Estructura de Archivos

```
components/
  ui/                    # Componentes base reutilizables
    empty-state.tsx
    loading-state.tsx
    error-state.tsx
    button.tsx
    card.tsx
  dashboard/             # Componentes específicos del dashboard
    quick-actions.tsx
    dashboard-stats.tsx
  [feature]/             # Componentes por funcionalidad
    medicamentos-client.tsx
```

## 🔄 Proceso de Revisión

Antes de implementar nuevas features:
1. ✅ ¿Es realmente necesario?
2. ✅ ¿Puedo simplificarlo?
3. ✅ ¿Es consistente con el resto?
4. ✅ ¿Funciona bien en móvil?
5. ✅ ¿Los textos son claros y directos?

---

**Última actualización**: 2025
**Mantenedor**: Equipo de Desarrollo Sentinel
