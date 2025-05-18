-- Crear tabla para el historial de actividad
CREATE TABLE IF NOT EXISTS activity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para las sesiones activas
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device TEXT NOT NULL,
  location TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Actualizar la tabla de perfiles para incluir campos adicionales
ALTER TABLE profiles 
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

-- Políticas de seguridad para el historial de actividad
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio historial de actividad"
  ON activity_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas de seguridad para las sesiones activas
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

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
