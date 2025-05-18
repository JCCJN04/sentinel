# Configuración de DocuVault

## Configuración de Supabase

Para que la aplicación funcione correctamente, es necesario configurar manualmente algunos aspectos en Supabase:

### 1. Crear el bucket de almacenamiento

1. Inicia sesión en el panel de administración de Supabase
2. Ve a la sección "Storage"
3. Crea un nuevo bucket llamado "documents"
4. Marca el bucket como público (para simplificar el acceso a los archivos)

### 2. Configurar las políticas de almacenamiento

1. Ve a la sección "SQL Editor" en el panel de administración de Supabase
2. Ejecuta el script `supabase/manual-setup.sql` que se encuentra en este repositorio

### 3. Verificar las tablas y políticas

1. Asegúrate de que todas las tablas necesarias estén creadas ejecutando el script `supabase/complete-schema.sql`
2. Verifica que las políticas de RLS (Row Level Security) estén habilitadas para todas las tablas

## Solución de problemas comunes

### Error al subir documentos

Si encuentras errores al subir documentos relacionados con políticas de seguridad, verifica:

1. Que el bucket "documents" exista y sea público
2. Que las políticas de almacenamiento estén correctamente configuradas
3. Que las políticas de RLS para la tabla "documents" permitan insertar registros

### Error al crear el perfil de usuario

Si encuentras errores al crear el perfil de usuario, verifica:

1. Que la tabla "profiles" exista
2. Que las políticas de RLS para la tabla "profiles" permitan insertar registros
