-- =====================================================
-- VERIFICACIÓN DEL MÓDULO DE DOCTORES
-- Ejecuta estas queries en tu Supabase Dashboard
-- =====================================================

-- 1. Verificar que todas las tablas existen
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'doctor_profiles',
    'doctor_patients',
    'consultations',
    'consultation_attachments',
    'doctor_prescriptions',
    'shared_documents_with_doctor',
    'doctor_availability'
  )
ORDER BY table_name;

-- 2. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'doctor_profiles',
    'doctor_patients',
    'consultations',
    'consultation_attachments',
    'doctor_prescriptions',
    'shared_documents_with_doctor',
    'doctor_availability'
  )
ORDER BY tablename, policyname;

-- 3. Verificar funciones creadas
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_doctor',
    'get_current_doctor_profile',
    'doctor_has_patient_access',
    'update_doctor_updated_at',
    'update_doctor_patient_stats'
  );

-- 4. Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    event_object_table LIKE 'doctor_%'
    OR event_object_table = 'consultations'
  )
ORDER BY event_object_table, trigger_name;

-- 5. Verificar índices
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename LIKE 'doctor_%'
    OR tablename = 'consultations'
    OR tablename = 'shared_documents_with_doctor'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- CONSULTAS DE EJEMPLO PARA PRUEBAS
-- =====================================================

-- Crear un perfil de doctor (reemplaza 'tu-user-id' con tu UUID de auth.users)
/*
INSERT INTO doctor_profiles (
  user_id,
  specialty,
  phone_number,
  bio,
  consultation_duration_minutes,
  accepts_new_patients
) VALUES (
  'tu-user-id',
  'Medicina General',
  '+521234567890',
  'Médico general con 10 años de experiencia',
  30,
  true
);
*/

-- Ver perfiles de doctores
SELECT 
  id,
  user_id,
  specialty,
  phone_number,
  accepts_new_patients,
  created_at
FROM doctor_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Ver relaciones doctor-paciente
SELECT 
  dp.id,
  dp.doctor_id,
  dp.patient_id,
  dp.total_consultations,
  dp.status,
  dp.created_at
FROM doctor_patients dp
ORDER BY dp.created_at DESC
LIMIT 10;

-- Ver consultas
SELECT 
  c.id,
  c.doctor_id,
  c.patient_id,
  c.scheduled_at,
  c.status,
  c.reason,
  c.created_at
FROM consultations c
ORDER BY c.scheduled_at DESC
LIMIT 10;

-- Ver recetas
SELECT 
  dp.id,
  dp.doctor_id,
  dp.patient_id,
  dp.medication_name,
  dp.dosage,
  dp.frequency,
  dp.start_date,
  dp.end_date,
  dp.created_at
FROM doctor_prescriptions dp
ORDER BY dp.created_at DESC
LIMIT 10;

-- =====================================================
-- ESTADÍSTICAS
-- =====================================================

-- Contar registros en cada tabla
SELECT 'doctor_profiles' as tabla, COUNT(*) as registros FROM doctor_profiles
UNION ALL
SELECT 'doctor_patients', COUNT(*) FROM doctor_patients
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations
UNION ALL
SELECT 'consultation_attachments', COUNT(*) FROM consultation_attachments
UNION ALL
SELECT 'doctor_prescriptions', COUNT(*) FROM doctor_prescriptions
UNION ALL
SELECT 'shared_documents_with_doctor', COUNT(*) FROM shared_documents_with_doctor
UNION ALL
SELECT 'doctor_availability', COUNT(*) FROM doctor_availability;

-- =====================================================
-- LIMPIAR DATOS DE PRUEBA (CUIDADO!)
-- =====================================================

/*
-- Solo ejecuta esto si necesitas limpiar datos de prueba
DELETE FROM consultation_attachments;
DELETE FROM doctor_prescriptions;
DELETE FROM consultations;
DELETE FROM doctor_patients;
DELETE FROM shared_documents_with_doctor;
DELETE FROM doctor_availability;
DELETE FROM doctor_profiles;
*/
