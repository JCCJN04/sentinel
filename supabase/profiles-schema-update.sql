-- Actualizar la tabla de perfiles para incluir campos adicionales
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "documentReminders": true,
  "expiryAlerts": true,
  "paymentReminders": true,
  "securityAlerts": true,
  "newsletterUpdates": false,
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "reminderFrequency": "weekly"
}'::jsonb,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear una tabla para el historial de actividad
CREATE TABLE IF NOT EXISTS activity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear una tabla para las sesiones activas
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device TEXT NOT NULL,
  location TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de seguridad para el historial de actividad
CREATE POLICY "Los usuarios pueden ver su propio historial de actividad"
  ON activity_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas de seguridad para las sesiones activas
CREATE POLICY "Los usuarios pueden ver sus propias sesiones activas"
  ON active_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias sesiones activas"
  ON active_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Función para registrar actividad
CREATE OR REPLACE FUNCTION log_activity(
  activity_type TEXT,
  description TEXT,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_history (user_id, activity_type, description, ip_address, user_agent)
  VALUES (auth.uid(), activity_type, description, ip_address, user_agent)
  RETURNING id INTO activity_id;
  
  -- Actualizar last_active en el perfil
  UPDATE profiles SET last_active = now() WHERE id = auth.uid();
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar una nueva sesión
CREATE OR REPLACE FUNCTION register_session(
  device TEXT,
  location TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO active_sessions (user_id, device, location, ip_address)
  VALUES (auth.uid(), device, location, ip_address)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para cerrar todas las sesiones excepto la actual
CREATE OR REPLACE FUNCTION close_other_sessions(
  current_session_id UUID
) RETURNS VOID AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE user_id = auth.uid() AND id != current_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar cambios en el perfil
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    'profile_update',
    'Actualización de perfil: ' || 
    CASE 
      WHEN OLD.full_name IS DISTINCT FROM NEW.full_name THEN 'nombre, '
      ELSE ''
    END ||
    CASE 
      WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'teléfono, '
      ELSE ''
    END ||
    CASE 
      WHEN OLD.language IS DISTINCT FROM NEW.language THEN 'idioma, '
      ELSE ''
    END ||
    CASE 
      WHEN OLD.timezone IS DISTINCT FROM NEW.timezone THEN 'zona horaria, '
      ELSE ''
    END ||
    CASE 
      WHEN OLD.date_format IS DISTINCT FROM NEW.date_format THEN 'formato de fecha, '
      ELSE ''
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profile_changes_trigger ON profiles;
CREATE TRIGGER profile_changes_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_profile_changes();

-- Función para eliminar cuenta de usuario
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
  -- Registrar la actividad
  PERFORM log_activity('account_deletion', 'Cuenta eliminada');
  
  -- Eliminar documentos y datos relacionados
  DELETE FROM documents WHERE owner_id = auth.uid();
  DELETE FROM document_reminders WHERE user_id = auth.uid();
  DELETE FROM document_shares WHERE owner_id = auth.uid();
  DELETE FROM active_sessions WHERE user_id = auth.uid();
  DELETE FROM activity_history WHERE user_id = auth.uid();
  
  -- Eliminar el perfil
  DELETE FROM profiles WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
