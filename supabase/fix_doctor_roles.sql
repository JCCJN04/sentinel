-- =====================================================
-- SCRIPT DE REPARACIÓN: Sistema de roles Doctor/Paciente
-- Ejecutar este script para corregir el problema de roles
-- =====================================================

-- 1. Crear la función y el trigger para futuros usuarios
CREATE OR REPLACE FUNCTION public.handle_new_doctor_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar si el nuevo usuario es un doctor
  IF NEW.raw_user_meta_data->>'user_type' = 'doctor' THEN
    -- Crear perfil de doctor con datos básicos
    INSERT INTO public.doctor_profiles (
      user_id,
      specialty,
      accepts_new_patients
    )
    VALUES (
      NEW.id,
      'Sin especificar', -- Especialidad por defecto
      true
    )
    ON CONFLICT (user_id) DO NOTHING; -- Evitar duplicados
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created_doctor ON auth.users;

-- Crear el trigger que se ejecuta después de insertar un nuevo usuario
CREATE TRIGGER on_auth_user_created_doctor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_doctor_user();

-- 2. Reparar usuarios existentes que son doctores pero no tienen perfil
INSERT INTO public.doctor_profiles (
  user_id,
  specialty,
  accepts_new_patients
)
SELECT 
  id,
  'Sin especificar',
  true
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'doctor'
  AND id NOT IN (SELECT user_id FROM public.doctor_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verificar el resultado
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  CASE 
    WHEN dp.id IS NOT NULL THEN 'Sí'
    ELSE 'No'
  END as tiene_perfil_doctor
FROM auth.users u
LEFT JOIN public.doctor_profiles dp ON u.id = dp.user_id
WHERE u.raw_user_meta_data->>'user_type' = 'doctor';
