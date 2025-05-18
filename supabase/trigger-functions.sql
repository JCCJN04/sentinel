-- Función para deshabilitar temporalmente el trigger de historial de documentos
CREATE OR REPLACE FUNCTION disable_document_history_trigger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE documents DISABLE TRIGGER add_document_history_trigger;
END;
$$;

-- Función para habilitar el trigger de historial de documentos
CREATE OR REPLACE FUNCTION enable_document_history_trigger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE documents ENABLE TRIGGER add_document_history_trigger;
END;
$$;

-- Otorgar permisos para ejecutar estas funciones
GRANT EXECUTE ON FUNCTION disable_document_history_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION enable_document_history_trigger TO authenticated;
