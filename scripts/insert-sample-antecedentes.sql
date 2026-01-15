-- Script para insertar datos de ejemplo en antecedentes médicos
-- INSTRUCCIONES: 
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Reemplaza 'TU_USER_ID_AQUI' con tu user_id real
-- 3. Ejecuta este script

-- IMPORTANTE: Reemplaza esto con tu user_id real de auth.users
-- Puedes obtenerlo ejecutando: SELECT id, email FROM auth.users LIMIT 1;
-- O desde la consola del navegador después de login: supabase.auth.getUser()

DO $$
DECLARE
  v_user_id UUID := 'TU_USER_ID_AQUI'; -- <-- CAMBIA ESTO
BEGIN
  -- Verificar que el user_id existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'El user_id % no existe. Por favor actualiza el script con un user_id válido.', v_user_id;
  END IF;

  -- ============================================
  -- ANTECEDENTES PERSONALES
  -- ============================================
  
  -- Enfermedades crónicas
  INSERT INTO public.user_personal_history (user_id, condition_name, diagnosis_date, notes)
  VALUES 
    (v_user_id, 'Diabetes Mellitus Tipo 2', '2020-03-15', 'Controlada con metformina 850mg. HbA1c: 6.5%'),
    (v_user_id, 'Hipertensión Arterial', '2019-07-22', 'En tratamiento con losartán 50mg. Presión promedio: 130/85'),
    (v_user_id, 'Asma Bronquial', '2015-11-08', 'Alérgica. Usa inhalador de rescate. Crisis esporádicas.');

  -- Cirugías previas
  INSERT INTO public.user_personal_history (user_id, condition_name, diagnosis_date, notes)
  VALUES 
    (v_user_id, 'Apendicectomía', '2010-06-20', 'Cirugía laparoscópica. Sin complicaciones. Hospital General.'),
    (v_user_id, 'Cesárea', '2018-02-14', 'Nacimiento prematuro semana 35. Bebé y madre sanos.');

  -- Alergias documentadas
  INSERT INTO public.user_personal_history (user_id, condition_name, diagnosis_date, notes)
  VALUES 
    (v_user_id, 'Alergia a Penicilina', '2005-03-01', 'Reacción anafiláctica. Usar alternativas como cefalosporinas.'),
    (v_user_id, 'Intolerancia a Lactosa', '2012-09-10', 'Síntomas gastrointestinales. Evitar productos lácteos o usar lactasa.');

  -- Enfermedades previas resueltas
  INSERT INTO public.user_personal_history (user_id, condition_name, diagnosis_date, notes)
  VALUES 
    (v_user_id, 'Hepatitis A', '2008-04-15', 'Curada completamente. Inmunidad adquirida.'),
    (v_user_id, 'Gastritis Crónica', '2016-11-30', 'Tratada con omeprazol. Actualmente asintomática.'),
    (v_user_id, 'Anemia Ferropénica', '2017-05-20', 'Tratada con suplementos de hierro. Niveles normalizados.');

  -- Hospitalizaciones
  INSERT INTO public.user_personal_history (user_id, condition_name, diagnosis_date, notes)
  VALUES 
    (v_user_id, 'Neumonía Bacteriana', '2021-01-10', 'Hospitalización 7 días. Tratamiento con antibióticos IV. Recuperación completa.');

  -- ============================================
  -- ANTECEDENTES FAMILIARES
  -- ============================================

  -- Línea materna
  INSERT INTO public.user_family_history (user_id, condition_name, family_member, notes)
  VALUES 
    (v_user_id, 'Diabetes Mellitus Tipo 2', 'Madre', 'Diagnosticada a los 55 años. Insulinodependiente.'),
    (v_user_id, 'Hipertensión Arterial', 'Madre', 'Desde los 50 años. Controlada con medicación.'),
    (v_user_id, 'Cáncer de Mama', 'Abuela materna', 'Diagnosticado a los 62 años. Tratamiento exitoso. Sobreviviente.'),
    (v_user_id, 'Osteoporosis', 'Abuela materna', 'Diagnóstico tardío. Fractura de cadera a los 78 años.'),
    (v_user_id, 'Enfermedad de Alzheimer', 'Abuelo materno', 'Inicio a los 70 años. Progresión rápida.');

  -- Línea paterna
  INSERT INTO public.user_family_history (user_id, condition_name, family_member, notes)
  VALUES 
    (v_user_id, 'Infarto Agudo de Miocardio', 'Padre', 'A los 58 años. Colocación de 2 stents. En seguimiento cardiológico.'),
    (v_user_id, 'Hipertensión Arterial', 'Padre', 'Desde los 45 años. Múltiples medicamentos.'),
    (v_user_id, 'Hipercolesterolemia', 'Padre', 'Familiar. Tratamiento con estatinas.'),
    (v_user_id, 'Cáncer de Próstata', 'Abuelo paterno', 'Diagnosticado a los 68 años. Fallecido a los 72 años.'),
    (v_user_id, 'Cirrosis Hepática', 'Abuelo paterno', 'Alcohólica. Complicaciones fatales.');

  -- Hermanos
  INSERT INTO public.user_family_history (user_id, condition_name, family_member, notes)
  VALUES 
    (v_user_id, 'Asma Bronquial', 'Hermano', 'Desde la infancia. Controlado con tratamiento.'),
    (v_user_id, 'Hipotiroidismo', 'Hermana', 'Diagnosticado a los 30 años. Tratamiento con levotiroxina.');

  -- Tíos/Primos (otros familiares)
  INSERT INTO public.user_family_history (user_id, condition_name, family_member, notes)
  VALUES 
    (v_user_id, 'Lupus Eritematoso Sistémico', 'Tía materna', 'Enfermedad autoinmune. En tratamiento con inmunosupresores.'),
    (v_user_id, 'Esquizofrenia', 'Tío paterno', 'Diagnosticado en juventud. Hospitalizado múltiples veces.'),
    (v_user_id, 'Epilepsia', 'Prima', 'Crisis tónico-clónicas. Controlada con anticonvulsivantes.');

  RAISE NOTICE 'Datos de ejemplo insertados exitosamente para user_id: %', v_user_id;
  RAISE NOTICE 'Total antecedentes personales: 11';
  RAISE NOTICE 'Total antecedentes familiares: 15';
  
END $$;
