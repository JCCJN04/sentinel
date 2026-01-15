-- Script para poblar el catálogo de condiciones médicas
-- INSTRUCCIONES: Ejecutar en Supabase SQL Editor

-- Limpiar catálogo existente (opcional)
-- DELETE FROM public.medical_conditions_catalog;

-- ============================================
-- ENFERMEDADES CARDIOVASCULARES
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Hipertensión Arterial', 'Presión arterial elevada de forma crónica', 'Cardiovascular'),
('Infarto Agudo de Miocardio', 'Ataque cardíaco por obstrucción de arterias coronarias', 'Cardiovascular'),
('Insuficiencia Cardíaca', 'El corazón no bombea sangre eficientemente', 'Cardiovascular'),
('Arritmia Cardíaca', 'Ritmo cardíaco irregular', 'Cardiovascular'),
('Angina de Pecho', 'Dolor torácico por reducción de flujo sanguíneo al corazón', 'Cardiovascular'),
('Enfermedad Coronaria', 'Estrechamiento de arterias coronarias', 'Cardiovascular'),
('Accidente Cerebrovascular (ACV)', 'Interrupción del flujo sanguíneo al cerebro', 'Cardiovascular'),
('Aneurisma', 'Dilatación anormal de un vaso sanguíneo', 'Cardiovascular');

-- ============================================
-- ENFERMEDADES METABÓLICAS Y ENDOCRINAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Diabetes Mellitus Tipo 1', 'Diabetes autoinmune, requiere insulina', 'Metabólica'),
('Diabetes Mellitus Tipo 2', 'Diabetes por resistencia a la insulina', 'Metabólica'),
('Diabetes Gestacional', 'Diabetes durante el embarazo', 'Metabólica'),
('Hipotiroidismo', 'Producción insuficiente de hormonas tiroideas', 'Endocrina'),
('Hipertiroidismo', 'Producción excesiva de hormonas tiroideas', 'Endocrina'),
('Obesidad', 'Exceso de grasa corporal', 'Metabólica'),
('Síndrome Metabólico', 'Conjunto de factores de riesgo cardiovascular', 'Metabólica'),
('Hipercolesterolemia', 'Colesterol elevado en sangre', 'Metabólica'),
('Hipertrigliceridemia', 'Triglicéridos elevados en sangre', 'Metabólica'),
('Gota', 'Acumulación de ácido úrico en articulaciones', 'Metabólica');

-- ============================================
-- ENFERMEDADES RESPIRATORIAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Asma Bronquial', 'Inflamación crónica de las vías respiratorias', 'Respiratoria'),
('EPOC (Enfermedad Pulmonar Obstructiva Crónica)', 'Obstrucción crónica del flujo de aire', 'Respiratoria'),
('Bronquitis Crónica', 'Inflamación crónica de los bronquios', 'Respiratoria'),
('Enfisema Pulmonar', 'Destrucción de alvéolos pulmonares', 'Respiratoria'),
('Neumonía', 'Infección pulmonar', 'Respiratoria'),
('Tuberculosis', 'Infección bacteriana de los pulmones', 'Respiratoria'),
('Apnea del Sueño', 'Pausas respiratorias durante el sueño', 'Respiratoria'),
('Fibrosis Pulmonar', 'Cicatrización del tejido pulmonar', 'Respiratoria');

-- ============================================
-- ENFERMEDADES GASTROINTESTINALES
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Gastritis Crónica', 'Inflamación crónica del estómago', 'Gastrointestinal'),
('Úlcera Péptica', 'Lesión en la mucosa gástrica o duodenal', 'Gastrointestinal'),
('Reflujo Gastroesofágico (ERGE)', 'Retorno del contenido gástrico al esófago', 'Gastrointestinal'),
('Enfermedad de Crohn', 'Inflamación crónica intestinal', 'Gastrointestinal'),
('Colitis Ulcerosa', 'Inflamación crónica del colon', 'Gastrointestinal'),
('Síndrome de Intestino Irritable', 'Trastorno funcional intestinal', 'Gastrointestinal'),
('Hepatitis B', 'Infección viral del hígado', 'Gastrointestinal'),
('Hepatitis C', 'Infección viral crónica del hígado', 'Gastrointestinal'),
('Cirrosis Hepática', 'Daño crónico y cicatrización del hígado', 'Gastrointestinal'),
('Cálculos Biliares', 'Piedras en la vesícula biliar', 'Gastrointestinal'),
('Pancreatitis Crónica', 'Inflamación crónica del páncreas', 'Gastrointestinal');

-- ============================================
-- ENFERMEDADES RENALES Y UROLÓGICAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Insuficiencia Renal Crónica', 'Pérdida progresiva de la función renal', 'Renal'),
('Cálculos Renales', 'Piedras en los riñones', 'Renal'),
('Infección Urinaria Recurrente', 'Infecciones frecuentes del tracto urinario', 'Urológica'),
('Incontinencia Urinaria', 'Pérdida involuntaria de orina', 'Urológica'),
('Hiperplasia Prostática Benigna', 'Agrandamiento no canceroso de la próstata', 'Urológica');

-- ============================================
-- ENFERMEDADES NEUROLÓGICAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Epilepsia', 'Trastorno neurológico con convulsiones', 'Neurológica'),
('Migraña', 'Cefalea intensa recurrente', 'Neurológica'),
('Enfermedad de Parkinson', 'Trastorno degenerativo del movimiento', 'Neurológica'),
('Enfermedad de Alzheimer', 'Demencia degenerativa', 'Neurológica'),
('Esclerosis Múltiple', 'Enfermedad autoinmune del sistema nervioso', 'Neurológica'),
('Neuropatía Diabética', 'Daño nervioso por diabetes', 'Neurológica'),
('Cefalea Tensional', 'Dolor de cabeza por tensión muscular', 'Neurológica');

-- ============================================
-- ENFERMEDADES PSIQUIÁTRICAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Depresión Mayor', 'Trastorno del estado de ánimo', 'Psiquiátrica'),
('Trastorno de Ansiedad Generalizada', 'Ansiedad crónica y excesiva', 'Psiquiátrica'),
('Trastorno Bipolar', 'Cambios extremos del estado de ánimo', 'Psiquiátrica'),
('Trastorno Obsesivo-Compulsivo (TOC)', 'Obsesiones y compulsiones', 'Psiquiátrica'),
('Trastorno de Pánico', 'Ataques de pánico recurrentes', 'Psiquiátrica'),
('Esquizofrenia', 'Trastorno psicótico crónico', 'Psiquiátrica'),
('Trastorno por Déficit de Atención (TDAH)', 'Dificultad para mantener atención', 'Psiquiátrica');

-- ============================================
-- ENFERMEDADES REUMATOLÓGICAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Artritis Reumatoide', 'Inflamación autoinmune de articulaciones', 'Reumatológica'),
('Osteoartritis', 'Desgaste del cartílago articular', 'Reumatológica'),
('Lupus Eritematoso Sistémico', 'Enfermedad autoinmune multisistémica', 'Reumatológica'),
('Fibromialgia', 'Dolor musculoesquelético crónico', 'Reumatológica'),
('Osteoporosis', 'Pérdida de densidad ósea', 'Reumatológica'),
('Espondilitis Anquilosante', 'Inflamación crónica de la columna', 'Reumatológica');

-- ============================================
-- CÁNCERES COMUNES
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Cáncer de Mama', 'Tumor maligno en tejido mamario', 'Oncológica'),
('Cáncer de Próstata', 'Tumor maligno en la próstata', 'Oncológica'),
('Cáncer de Pulmón', 'Tumor maligno en los pulmones', 'Oncológica'),
('Cáncer de Colon', 'Tumor maligno en el intestino grueso', 'Oncológica'),
('Cáncer de Estómago', 'Tumor maligno gástrico', 'Oncológica'),
('Leucemia', 'Cáncer de la sangre', 'Oncológica'),
('Linfoma', 'Cáncer del sistema linfático', 'Oncológica'),
('Cáncer de Piel (Melanoma)', 'Tumor maligno cutáneo', 'Oncológica');

-- ============================================
-- ALERGIAS E INMUNOLOGÍA
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Alergia a Penicilina', 'Reacción alérgica a antibióticos penicilínicos', 'Alergia'),
('Alergia a AINEs', 'Reacción a antiinflamatorios no esteroideos', 'Alergia'),
('Alergia al Polen', 'Rinitis alérgica estacional', 'Alergia'),
('Alergia a Ácaros del Polvo', 'Reacción a ácaros domésticos', 'Alergia'),
('Alergia Alimentaria (Mariscos)', 'Reacción alérgica a crustáceos', 'Alergia'),
('Alergia Alimentaria (Nueces)', 'Reacción alérgica a frutos secos', 'Alergia'),
('Intolerancia a Lactosa', 'Dificultad para digerir lactosa', 'Alergia'),
('Enfermedad Celíaca', 'Intolerancia al gluten', 'Alergia');

-- ============================================
-- ENFERMEDADES GINECOLÓGICAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Endometriosis', 'Tejido endometrial fuera del útero', 'Ginecológica'),
('Síndrome de Ovario Poliquístico (SOP)', 'Desequilibrio hormonal en mujeres', 'Ginecológica'),
('Miomas Uterinos', 'Tumores benignos en el útero', 'Ginecológica'),
('Quistes Ováricos', 'Sacos llenos de líquido en ovarios', 'Ginecológica');

-- ============================================
-- ENFERMEDADES INFECCIOSAS
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('VIH/SIDA', 'Infección por virus de inmunodeficiencia humana', 'Infecciosa'),
('Hepatitis A', 'Infección viral aguda del hígado', 'Infecciosa'),
('Dengue', 'Infección viral transmitida por mosquitos', 'Infecciosa'),
('COVID-19', 'Infección por coronavirus SARS-CoV-2', 'Infecciosa'),
('Varicela', 'Infección viral exantemática', 'Infecciosa');

-- ============================================
-- CIRUGÍAS COMUNES
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Apendicectomía', 'Extirpación quirúrgica del apéndice', 'Cirugía'),
('Colecistectomía', 'Extirpación de la vesícula biliar', 'Cirugía'),
('Cesárea', 'Parto quirúrgico', 'Cirugía'),
('Histerectomía', 'Extirpación del útero', 'Cirugía'),
('Hernia Inguinal Reparada', 'Cirugía de reparación de hernia', 'Cirugía'),
('Cirugía de Cataratas', 'Reemplazo del cristalino opaco', 'Cirugía'),
('Amigdalectomía', 'Extirpación de amígdalas', 'Cirugía'),
('Bypass Gástrico', 'Cirugía bariátrica para obesidad', 'Cirugía');

-- ============================================
-- OTRAS CONDICIONES IMPORTANTES
-- ============================================
INSERT INTO public.medical_conditions_catalog (name, description, category) VALUES
('Anemia Ferropénica', 'Deficiencia de hierro', 'Hematológica'),
('Anemia Perniciosa', 'Deficiencia de vitamina B12', 'Hematológica'),
('Hipoglucemia', 'Niveles bajos de azúcar en sangre', 'Metabólica'),
('Deshidratación Crónica', 'Falta crónica de líquidos', 'General'),
('Desnutrición', 'Falta de nutrientes esenciales', 'General'),
('Alcoholismo', 'Dependencia al alcohol', 'Adicción'),
('Tabaquismo', 'Adicción al tabaco', 'Adicción');

-- Mensaje de éxito
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.medical_conditions_catalog;
  RAISE NOTICE 'Catálogo poblado exitosamente con % condiciones médicas', v_count;
END $$;
