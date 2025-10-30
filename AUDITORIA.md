# Auditoría Técnica del Sistema

## 1. Descripción general del sistema

### 1.1 Arquitectura actual
- Aplicación monolítica construida con Next.js 14 (App Router) y TypeScript.
- Renderizado mayoritariamente del lado del cliente; servicios compartidos en `lib/` para Supabase y utilidades.
- Contextos duplicados de tema (`app/layout.tsx`, `app/providers.tsx`, `components/theme-provider.tsx`) y carpeta redundante `app/app/`, señalando refactors incompletos.

### 1.2 Componentes principales e interacciones
- `hooks/use-auth.tsx` provee autenticación, usada por `AuthProvider` y `middleware.ts` para proteger rutas `/dashboard`.
- Componentes de dashboard (`components/dashboard/*.tsx`) consumen servicios como `lib/document-service.ts` para documentos y estadísticas.
- Generación de reportes PDF (`app/api/reports/health-summary/route.tsx`) combina Supabase con Puppeteer/Chromium para renderizar vistas protegidas.
- Secciones de configuración (`components/settings/*.tsx`) dependen de `lib/user-service.ts`; varias funciones dentro del servicio están simuladas.
- Módulos de IA (`components/dashboard/ai-chat-assistant.tsx`, `lib/document-analysis-service.ts`) aún operan con datos locales/hardcodeados.

### 1.3 Tecnologías, frameworks y versiones
- Next.js ^14.2.5, React ^18.3.1, TypeScript ^5.x, TailwindCSS ^3.4.x, shadcn/ui y Radix UI 1.x.
- Supabase JS ^2.43.x (auth, storage, base de datos), TanStack React Table ^8, Framer Motion ^12, axios, react-hook-form, zod (instalado pero subutilizado).
- Generación de PDF con Puppeteer ^24 y `@sparticuz/chromium` para entornos serverless; uso declarado de `@google/generative-ai` y OpenRouter.

## 2. Infraestructura

### 2.1 Entorno de despliegue
- Scripts `dev/build/start` sugieren despliegue tradicional de Next.js (probable Vercel/Node). Falta Docker o IaC.
- Middleware fija `runtime = 'nodejs'`; la ruta de PDF requiere binarios Chromium, lo que indica ejecución en lambdas Node.

### 2.2 Configuración de servidores, servicios y redes
- Dependencia crítica de Supabase (auth, storage S3-compat, Postgres). No se documenta CDN ni balanceo.
- Rutas API internas (FDA, OpenRouter) consumen servicios externos sin caché ni rate limiting.
- No hay configuración de entornos (staging/prod) ni orquestación visible.

### 2.3 Dependencias externas
- Supabase (public y service role keys), API pública de la FDA (etiquetado de medicamentos), OpenRouter (IA), potencial Google Gemini.
- Ausencia de verificación de disponibilidad/health checks.

## 3. Código y estructura del proyecto

### 3.1 Organización de módulos/carpetas/archivos
- `app/` divide rutas por dominio (`dashboard/*`, `login`, `registro`), pero contiene carpetas vacías y duplicadas.
- `components/` agrupa UI reutilizable por dominio; `lib/` concentra servicios extensos (documentos, reportes, usuarios, IA) con lógica mezclada.
- No existen pruebas automatizadas ni carpeta de tests.

### 3.2 Patrones de diseño
- Servicios estilo módulo singleton que encapsulan llamadas Supabase, pero mezclan validaciones, efectos y cálculo.
- Componentes grandes sin separación container/presentational (p.ej. `components/settings/security-settings.tsx` >500 líneas).
- Server actions etiquetadas `'use server'` usan el cliente browser de Supabase, rompiendo el patrón server-only.

### 3.3 Calidad y mantenibilidad
- Código legible pero con archivos muy extensos y duplicación de lógica (`documentService` vs `reportsService`).
- Uso frecuente de `any`, escasa validación con zod, carencia de linting adicional.
- Carpetas y funciones obsoletas (`app/api/documents/analyze`, simulaciones en `lib/user-service.ts`).

### 3.4 Deuda técnica y duplicaciones
- Estimaciones de tamaño de archivos ficticias (`documentService.getUserStats`).
- AI chat y reportes dependen de datos completos en cliente, sin optimización.
- `lib/setup-storage.ts` intenta crear buckets/políticas desde el cliente (enfoque inseguro y abandonado).

## 4. Base de datos / almacenamiento

### 4.1 Tipo y modelo
- Supabase Postgres (ver `backup.sql`) con tablas `documents`, `document_shares`, `document_history`, `profiles`, `user_allergies`, etc., triggers de auditoría y ENUMs.
- Buckets de storage: `documents`, `avatars` (gestión desde cliente).

### 4.2 Relaciones, índices y consistencia
- Relaciones definidas vía FKs; RLS habilitado en la mayoría de tablas.
- Faltan índices en `documents(user_id)` y `documents(created_at)`; consultas intensivas se degradarán al crecer el volumen.
- Funciones de auditoría agregan historial automáticamente.

### 4.3 Riesgos de rendimiento/integridad
- Funciones `run_sql` y `run_sql_with_results` (`SECURITY DEFINER`) expuestas a roles `anon` y `authenticated`, permitiendo ejecutar SQL arbitrario y romper RLS (riesgo crítico).
- Falta de constraints de unicidad para prevenir duplicados.
- Estimaciones de almacenamiento basadas en heurísticas, no en metadatos reales.

## 5. Seguridad

### 5.1 Manejo de credenciales y secretos
- `NEXT_PUBLIC_SUPABASE_*` requeridos (ok para anon), pero `NEXT_PUBLIC_OPENROUTER_API_KEY` expone clave de un servicio pago.
- Rutas server (`app/api/medications/*.ts`) usan `SUPABASE_SERVICE_ROLE_KEY`; correcto sólo si se protege estrictamente del cliente.
- No hay rotación ni gestión centralizada de secretos.

### 5.2 Validación y sanitización
- Formularios clave sin esquemas (`react-hook-form` sin zod); ausencia de sanitización previa a queries externas.
- `app/api/medications/details` interpolando `name` sin `encodeURIComponent` (riesgo de error, no de inyección directa).

### 5.3 Permisos y roles
- Middleware protege `/dashboard`; vistas especiales (`/dashboard/reportes/health-summary/preview`) pueden quedar expuestas si se conoce el query.
- RLS bien definida, pero se invalida debido a `run_sql` accesible públicamente.
- `lib/user-service.ts` ejecuta operaciones sensibles desde el cliente sin verificación adicional.

### 5.4 Riesgos y vectores de ataque
- Ejecución arbitraria de SQL mediante `run_sql` → permite exfiltrar datos, borrar tablas o escalar permisos.
- Claves públicas reutilizables permiten abuso de APIs pagas.
- Buckets y políticas gestionadas desde cliente pueden derivar en privilegios excesivos.
- Falta de rate limiting expone APIs a uso abusivo.

## 6. Rendimiento

### 6.1 Tiempo de respuesta y consumo de recursos
- `DashboardStats` y AI chat descargan todo el dataset por usuario cada render (sin paginación ni caching).
- Generación de PDF lanza Puppeteer en cada llamada; consumo elevado en entornos serverless.
- Logging abundante (`console.log`) en middleware y servicios.

### 6.2 Cuellos de botella
- Índices faltantes implican scans completos.
- Operaciones intensivas en cliente (análisis, paneles IA) bloquean UI.
- Falta de colas o workers para procesos pesados (OCR, IA, reportes).

## 7. Experiencia de usuario

### 7.1 Flujo y fricciones
- Landing extensa y pesada sin optimizar imágenes ni `next/image`.
- Varias secciones del dashboard muestran componentes simulados o sin datos reales.
- Modal de IA abre aunque el backend no esté operativo.

### 7.2 Accesibilidad
- Pocos atributos ARIA; tabs y selects podrían ser difíciles en lectores de pantalla.
- Doble gestión de tema puede producir parpadeos al iniciar.

## 8. Logs, monitoreo y manejo de errores

- No existe integración con Sentry/Datadog ni alertas configuradas.
- Manejo básico de errores (`console.error`) sin fallback UI.
- Sin centralización de logs ni métricas de rendimiento.

## 9. Conclusiones y recomendaciones

### 9.1 Problemas críticos
1. Funciones SQL `run_sql` y `run_sql_with_results` accesibles a `anon/authenticated` permiten ejecución arbitraria de SQL, anulando RLS y comprometiendo la base de datos.
2. Exposición de `NEXT_PUBLIC_OPENROUTER_API_KEY` e integración IA desde el cliente abre la puerta a uso malicioso.
3. Server actions y servicios server (`'use server'`) usando el cliente browser de Supabase provocan fallos y fugas potenciales de sesión.
4. Ausencia de índices en tablas grandes (`documents`, `document_history`) degradará severamente el rendimiento conforme crezca la data.
5. Generación de PDF maneja cookies manualmente; un error en dominio/subdominio puede filtrar sesiones.

### 9.2 Problemas moderados
- Código duplicado/obsoleto, componentes extensos sin modularización, estimaciones ficticias de almacenamiento, ausencia de validación fuerte, falta de paginación y caching.

### 9.3 Problemas menores
- Logging excesivo en producción, políticas duplicadas en Supabase, doble proveedor de tema, ausencia de pruebas y CI/CD documentado.

### 9.4 Priorización de acciones
1. Revocar y eliminar funciones SQL peligrosas (`run_sql*`), revisando todos los objetos `SECURITY DEFINER`.
2. Migrar claves sensibles a variables privadas y exponer servicios IA sólo vía endpoints server-side con rate limiting.
3. Actualizar servicios server para utilizar `createClient` de `lib/supabase/server.ts` y aislar lógica en el backend.
4. Crear índices faltantes y revisar planes de consulta para tablas críticas.
5. Introducir validación con zod y sanitización antes de ejecutar operaciones o llamar APIs externas.
6. Refactorizar componentes grandes y eliminar carpetas/funciones obsoletas.
7. Implementar paginación, agregados server-side y caching donde aplique (dashboard, reportes, IA).
8. Establecer pipeline CI/CD con `next lint`, pruebas mínimas e integración con monitoreo (Sentry/Logflare) y alertas.
9. Documentar infraestructura real (proveedor, dominios, backups) y versionar migraciones en el repositorio.

### 9.5 Pasos concretos siguientes
1. Auditoría de seguridad en Supabase (revocar funciones, revisar RLS y roles).
2. Configurar proxy/server para APIs externas y mover claves a entorno seguro.
3. Optimizar consultas con índices y mover cálculos pesados al backend.
4. Modularizar componentes críticos y limpiar código muerto.
5. Integrar monitoreo y plan de pruebas antes de escalar usuarios/facturación.

## 10. Información pendiente
- Confirmar entorno de despliegue real (proveedor, CI/CD, dominios, certificados).
- Estado actualizado de la base de datos productiva (el dump puede no reflejar la realidad).
- Políticas de backup, recuperación ante desastres y métricas actuales (tráfico, latencia, uso de recursos).
- Definir roadmap para funcionalidades IA/analíticas y responsables de mantenimiento.
