-- =====================================================
-- TRIGGER: Crear perfil de doctor automáticamente
-- Cuando un usuario se registra con user_type='doctor'
-- se crea automáticamente su perfil en doctor_profiles
-- =====================================================

-- Función para manejar la creación automática del perfil de doctor
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

COMMENT ON FUNCTION public.handle_new_doctor_user() IS 
  'Crea automáticamente un perfil de doctor cuando un usuario se registra con user_type=doctor';
