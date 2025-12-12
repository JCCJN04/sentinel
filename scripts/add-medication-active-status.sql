-- Script para agregar funcionalidad de estado activo/inactivo a medicamentos
-- Esto permite que los medicamentos se marquen automáticamente como inactivos
-- cuando todas sus dosis han sido completadas

-- 1. Agregar columna is_active a prescription_medicines
ALTER TABLE prescription_medicines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_prescription_medicines_is_active 
ON prescription_medicines(is_active, prescription_id);

-- 3. Función para verificar y actualizar el estado de un medicamento
CREATE OR REPLACE FUNCTION check_medication_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_doses INT;
  completed_doses INT;
  medication_id UUID;
BEGIN
  -- Obtener el ID del medicamento
  medication_id := NEW.prescription_medicine_id;
  
  -- Contar total de dosis programadas
  SELECT COUNT(*) INTO total_doses
  FROM medication_doses
  WHERE prescription_medicine_id = medication_id;
  
  -- Contar dosis completadas (taken)
  SELECT COUNT(*) INTO completed_doses
  FROM medication_doses
  WHERE prescription_medicine_id = medication_id
    AND status = 'taken';
  
  -- Si todas las dosis están completadas, marcar medicamento como inactivo
  IF total_doses > 0 AND completed_doses >= total_doses THEN
    UPDATE prescription_medicines
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = medication_id;
    
    RAISE NOTICE 'Medicamento % marcado como inactivo (% de % dosis completadas)', 
      medication_id, completed_doses, total_doses;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger que se ejecuta después de actualizar una dosis
DROP TRIGGER IF EXISTS trigger_check_medication_completion ON medication_doses;
CREATE TRIGGER trigger_check_medication_completion
  AFTER UPDATE OF status, taken_at ON medication_doses
  FOR EACH ROW
  WHEN (NEW.status = 'taken' AND OLD.status != 'taken')
  EXECUTE FUNCTION check_medication_completion();

-- 5. Función para reactivar un medicamento (útil si se necesita)
CREATE OR REPLACE FUNCTION reactivate_medication(med_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prescription_medicines
  SET is_active = TRUE, updated_at = NOW()
  WHERE id = med_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Actualizar medicamentos existentes basándose en si tienen dosis pendientes
-- Esto es para datos existentes
UPDATE prescription_medicines pm
SET is_active = (
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN FALSE -- Sin dosis = inactivo
    WHEN COUNT(*) FILTER (WHERE status != 'taken') > 0 THEN TRUE -- Tiene dosis pendientes = activo
    ELSE FALSE -- Todas las dosis tomadas = inactivo
  END
  FROM medication_doses md
  WHERE md.prescription_medicine_id = pm.id
);

-- 7. Comentarios para documentación
COMMENT ON COLUMN prescription_medicines.is_active IS 
  'Indica si el medicamento está activo. Se marca automáticamente como FALSE cuando todas las dosis han sido completadas.';

COMMENT ON FUNCTION check_medication_completion() IS 
  'Verifica si todas las dosis de un medicamento han sido completadas y actualiza is_active en consecuencia.';

COMMENT ON FUNCTION reactivate_medication(UUID) IS 
  'Reactiva manualmente un medicamento que fue marcado como inactivo.';
