-- Migration: Agregar soporte para recordatorios de WhatsApp
-- Fecha: 2025-11-29
-- Descripción: Agrega campos necesarios para enviar recordatorios por WhatsApp

-- 1. Agregar campo de teléfono a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false;

-- 2. Agregar índice para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number 
ON profiles(phone_number) 
WHERE phone_number IS NOT NULL;

-- 3. Comentarios para documentación
COMMENT ON COLUMN profiles.phone_number IS 'Número de teléfono con código de país (ej: +521234567890)';
COMMENT ON COLUMN profiles.whatsapp_notifications_enabled IS 'Si el usuario desea recibir recordatorios por WhatsApp';
