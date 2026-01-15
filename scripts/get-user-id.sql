-- Script para obtener tu user_id
-- Ejecuta esto primero en Supabase SQL Editor para obtener tu user_id

SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email LIKE '%@%'
ORDER BY created_at DESC
LIMIT 10;

-- Copia el 'user_id' de tu cuenta y pégalo en insert-sample-antecedentes.sql
-- donde dice 'TU_USER_ID_AQUI'
