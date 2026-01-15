-- 1. Agregar columna role a profiles
ALTER TABLE profiles 
ADD COLUMN role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));

-- 2. Crear índice para búsquedas por rol
CREATE INDEX idx_profiles_role ON profiles(role);

-- 3. Actualizar tu usuario a rol doctor
UPDATE profiles 
SET role = 'doctor' 
WHERE id = '515f51d5-027f-4566-bb93-77f8ed6ba159';

-- 4. Verificar que se aplicó correctamente (usando first_name y last_name)
SELECT 
  id, 
  CONCAT(first_name, ' ', last_name) as full_name,
  role 
FROM profiles 
WHERE id = '515f51d5-027f-4566-bb93-77f8ed6ba159';
