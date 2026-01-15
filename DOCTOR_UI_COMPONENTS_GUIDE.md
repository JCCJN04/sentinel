# 🎨 Guía de Uso - Componentes UI Doctores

## 📚 Componentes Disponibles

### 1. PageHeader

Header premium reutilizable para todas las páginas.

```tsx
import { PageHeader } from "@/components/doctor/page-header"
import { Users, Plus } from "lucide-react"

<PageHeader
  title="Gestión de Pacientes"
  description="Administra y da seguimiento a todos tus pacientes activos"
  badge={{
    icon: Users,
    text: "Módulo Pacientes"
  }}
  action={{
    label: "Agregar Paciente",
    onClick: () => router.push("/doctor/pacientes/nuevo")
  }}
/>
```

**Props:**
- `title` (string) - Título de la página
- `description?` (string) - Descripción opcional
- `badge?` (object) - Badge opcional con icono y texto
- `action?` (object) - Botón de acción con label y onClick/href
- `className?` (string) - Clases adicionales

### 2. QuickAction & QuickActionsGrid

Cards de acciones rápidas para navegación eficiente.

```tsx
import { QuickAction, QuickActionsGrid } from "@/components/doctor/quick-action"
import { Calendar, Users, FileText, Pill } from "lucide-react"

<QuickActionsGrid>
  <QuickAction
    title="Nueva Consulta"
    description="Programa una consulta con un paciente"
    icon={Calendar}
    href="/doctor/consultas/nueva"
    variant="primary"
  />
  <QuickAction
    title="Agregar Paciente"
    description="Invita o registra un nuevo paciente"
    icon={Users}
    href="/doctor/pacientes/nuevo"
    variant="accent"
  />
  <QuickAction
    title="Ver Documentos"
    description="Revisa documentos compartidos"
    icon={FileText}
    href="/doctor/documentos"
    variant="info"
  />
</QuickActionsGrid>
```

**Props QuickAction:**
- `title` (string) - Título de la acción
- `description` (string) - Descripción breve
- `icon` (LucideIcon) - Ícono contextual
- `href` (string) - Link de destino
- `variant?` (string) - "primary" | "accent" | "info" | "warning"
- `className?` (string) - Clases adicionales

### 3. EmptyState

### 3. EmptyState

Componente para mostrar estados vacíos con personalidad.

```tsx
import { EmptyState } from "@/components/doctor/empty-state"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Ejemplo básico
<EmptyState
  icon={Calendar}
  title="No hay consultas programadas"
  description="¡Perfecto momento para un descanso! ☕"
  variant="primary"
/>

// Con acción
<EmptyState
  icon={Users}
  title="Aún no tienes pacientes"
  description="Invita a tus primeros pacientes para comenzar"
  variant="primary"
  action={
    <Button asChild className="rounded-2xl">
      <Link href="/doctor/pacientes/invitar">
        Invitar Paciente
      </Link>
    </Button>
  }
/>
```

**Props:**
- `icon` (LucideIcon) - Ícono a mostrar
- `title` (string) - Título principal
- `description` (string) - Descripción amigable
- `variant?` (string) - "default" | "primary" | "accent" | "info" | "warning"
- `action?` (ReactNode) - Elemento de acción opcional
- `className?` (string) - Clases adicionales

**Variantes disponibles:** "default", "primary", "accent", "info", "warning"

### 4. StatCard

Card premium para mostrar estadísticas con estilo.

```tsx
import { StatCard } from "@/components/doctor/stat-card"
import { Users } from "lucide-react"

<StatCard
  title="Pacientes Activos"
  value={totalPatients}
  description="Bajo tu cuidado"
  icon={Users}
  variant="primary"
  trend="up"
  trendValue="+12%"
/>
```

**Props:**
- `title` (string) - Título de la estadística
- `value` (string | number) - Valor principal
- `description` (string) - Descripción secundaria
- `icon` (LucideIcon) - Ícono contextual
- `variant?` (string) - "primary" | "accent" | "info" | "warning" | "success"
- `trend?` (string) - "up" | "down" | "neutral"
- `trendValue?` (string) - Valor de la tendencia (ej: "+12%")
- `className?` (string) - Clases adicionales

### 3. Skeleton Components

Componentes de carga para mejor UX.

```tsx
import { 
  DashboardSkeleton,
  StatCardSkeleton,
  ConsultationCardSkeleton,
  Skeleton 
} from "@/components/doctor/skeleton"

// Loading de dashboard completo
<DashboardSkeleton />

// Loading de stat cards
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCardSkeleton />
  <StatCardSkeleton />
  <StatCardSkeleton />
  <StatCardSkeleton />
</div>

// Skeleton personalizado
<Skeleton className="h-10 w-full rounded-2xl" />
```

## 🎨 Sistema de Colores

### Variantes Disponibles

Todos los componentes soportan estas variantes:

```tsx
// Verde/Teal médico (default)
variant="primary"

// Verde suave complementario
variant="accent"

// Azul información
variant="info"

// Amarillo advertencia
variant="warning"

// Verde éxito
variant="success"

// Gris neutral
variant="default"
```

### Uso de Colores en Tailwind

```tsx
// Backgrounds
className="bg-primary/5"        // Fondo muy sutil
className="bg-primary/10"       // Fondo suave
className="bg-primary"          // Color sólido

// Borders
className="border-primary/20"   // Borde sutil
className="border-primary/40"   // Borde medio

// Text
className="text-primary"        // Texto primario
className="text-muted-foreground" // Texto secundario

// Gradientes
className="bg-gradient-to-br from-primary/5 to-transparent"
className="bg-gradient-to-r from-primary to-accent"
```

## 🎭 Animaciones

### Clases Disponibles

```tsx
// Hover effects
className="hover-lift"        // Elevación en hover
className="hover-scale"       // Escala sutil en hover

// Entrada
className="animate-fade-in"   // Fade in suave
className="animate-scale-in"  // Escala y fade in
className="animate-appear"    // Appear con slide

// Animaciones especiales
className="stagger-children"  // Anima hijos escalonados
className="skeleton"          // Shimmer loading
```

### Ejemplos de Uso

```tsx
// Card con hover effect
<Card className="hover-lift transition-all">
  {/* contenido */}
</Card>

// Botón con escala en hover
<Button className="hover-scale rounded-2xl">
  Click me
</Button>

// Lista con entrada escalonada
<div className="stagger-children space-y-3">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

## 🔲 Bordes Redondeados

### Sistema de Radius

```tsx
// Extra grande (cards principales)
className="rounded-3xl"   // 24px - Hero sections, containers

// Grande (componentes)
className="rounded-2xl"   // 16px - Cards, buttons principales

// Medio (elementos interactivos)
className="rounded-xl"    // 12px - Badges, pequeños containers

// Estándar (pequeños elementos)
className="rounded-lg"    // 8px - Tags, pequeños badges
```

## 📱 Responsive Patterns

### Grid de Stats

```tsx
// Responsive: 1 col → 2 cols → 4 cols
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
</div>
```

### Grid de Contenido

```tsx
// Responsive: 1 col → 2 cols
<div className="grid gap-6 lg:grid-cols-2">
  <Card>{/* columna izquierda */}</Card>
  <Card>{/* columna derecha */}</Card>
</div>
```

### Padding Responsivo

```tsx
// Aumenta en pantallas grandes
className="p-6 lg:p-8"
className="px-4 lg:px-6"
```

## 🎯 Patterns Comunes

### Hero Section

```tsx
<div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-8 shadow-2xl backdrop-blur-sm lg:p-10">
  {/* Glows decorativos */}
  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
  
  <div className="relative">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold text-primary">
        Panel Profesional
      </span>
    </div>
    
    {/* Título */}
    <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
      ¡Bienvenido de vuelta! 👋
    </h1>
    
    {/* CTA */}
    <Button className="bg-gradient-to-r from-primary to-accent rounded-2xl">
      Acción Principal
    </Button>
  </div>
</div>
```

### Lista con Hover Effects

```tsx
<div className="space-y-3">
  {items.map((item, index) => (
    <div
      key={item.id}
      className="group rounded-2xl border border-primary/10 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover-scale"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* contenido */}
    </div>
  ))}
</div>
```

### Card con Header

```tsx
<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
  <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl">Título de Sección</CardTitle>
      </div>
      <Button variant="ghost" size="sm" className="text-primary">
        Ver todas →
      </Button>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* contenido */}
  </CardContent>
</Card>
```

## ✍️ Copy Writing Tips

### Estados Vacíos

✅ **Bueno**: "No hay consultas programadas. ¡Perfecto momento para un descanso! ☕"  
❌ **Malo**: "No se encontraron consultas programadas."

✅ **Bueno**: "Aún no tienes pacientes. Invita a tus primeros pacientes para comenzar 🚀"  
❌ **Malo**: "La lista de pacientes está vacía."

### Descripciones

✅ **Bueno**: "Bajo tu cuidado"  
❌ **Malo**: "Número total de pacientes activos"

✅ **Bueno**: "Tratamientos en curso"  
❌ **Malo**: "Recetas activas en el sistema"

## 🎨 Gradientes Recomendados

```tsx
// Backgrounds sutiles
"bg-gradient-to-br from-primary/5 to-transparent"
"bg-gradient-to-br from-accent/5 to-transparent"

// Backgrounds medios
"bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5"

// Botones y elementos destacados
"bg-gradient-to-r from-primary to-accent"

// Texto con gradiente
"bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
```

---

**💡 Tip**: Mantén la consistencia usando estos patterns en todas las páginas del módulo de doctores para una experiencia cohesiva y memorable.
