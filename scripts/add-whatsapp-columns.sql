-- Agregar columnas necesarias para WhatsApp a la tabla profiles
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Agregar phone_number si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Agregar whatsapp_notifications_enabled si no existe  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false;

-- Copiar datos de phone a phone_number si phone tiene datos
UPDATE public.profiles 
SET phone_number = phone 
WHERE phone IS NOT NULL AND phone_number IS NULL;

-- Verificar las columnas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone_number', 'whatsapp_notifications_enabled', 'first_name', 'last_name');
