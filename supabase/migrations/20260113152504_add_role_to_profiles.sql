-- Agregar columna role a profiles si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));

-- Crear índice para mejorar búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Actualizar el usuario doctor existente con el rol correcto
-- (usando el user_id del doctor_profile que ya existe)
UPDATE profiles 
SET role = 'doctor' 
WHERE id = '515f51d5-027f-4566-bb93-77f8ed6ba159';

-- Comentario: Si tienes más doctores en doctor_profiles, ejecuta:
-- UPDATE profiles p
-- SET role = 'doctor'
-- FROM doctor_profiles dp
-- WHERE p.id = dp.user_id AND p.role IS NULL;
