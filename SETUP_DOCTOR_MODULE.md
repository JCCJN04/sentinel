# Instrucciones para configurar Supabase

Para que el módulo de doctores funcione correctamente, necesitas configurar las credenciales de Supabase.

## Pasos:

1. **Crea un archivo `.env.local` en la raíz del proyecto** (copiando de `.env.example`):

```bash
cp .env.example .env.local
```

2. **Obtén tus credenciales de Supabase:**
   - Ve a https://supabase.com/dashboard/project/ouhyjucktnlvarnehcvd/settings/api
   - Copia la URL del proyecto
   - Copia la clave `anon` (public)
   - Copia la clave `service_role` (para scripts del servidor)

3. **Actualiza tu `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Una vez configurado, ejecuta el script de diagnóstico:**

```bash
npx tsx scripts/check-doctor-setup.ts
```

Este script te dirá:
- Si las tablas existen
- Si hay perfiles de doctor configurados
- Qué necesitas crear en la base de datos

## Si no tienes perfiles de doctor:

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- 1. Crear un perfil de doctor para tu usuario
INSERT INTO doctor_profiles (user_id, specialty, license_number, phone_number, office_address)
VALUES (
  'tu-user-id-aqui', -- Reemplaza con tu user ID de auth.users
  'Medicina General',
  'LIC-123456',
  '+52 123 456 7890',
  'Consultorio médico'
);

-- 2. Verificar que se creó
SELECT * FROM doctor_profiles;
```

Para obtener tu user ID, ejecuta en Supabase:

```sql
SELECT id, email, raw_user_meta_data->>'full_name' as name 
FROM auth.users 
WHERE email = 'tu-email@ejemplo.com';
```
