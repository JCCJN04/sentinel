-- Verificar si la tabla documents existe y su estructura
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Verificar si la columna user_id existe en la tabla documents
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'La columna user_id no existe en la tabla documents. Verificando estructura...';
    
    -- Mostrar la estructura actual de la tabla documents
    RAISE NOTICE 'Estructura de la tabla documents:';
    FOR r IN (
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
    ) LOOP
      RAISE NOTICE '% - %', r.column_name, r.data_type;
    END LOOP;
  END IF;
END $$;

-- Crear tabla para compartir documentos si no existe
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Cambiado de user_id a owner_id
  shared_with TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false, "edit": false, "print": false}',
  share_method TEXT NOT NULL DEFAULT 'link',
  password TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS document_shares_document_id_idx ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS document_shares_owner_id_idx ON document_shares(owner_id); -- Cambiado de user_id a owner_id
CREATE INDEX IF NOT EXISTS document_shares_status_idx ON document_shares(status);

-- Crear políticas de seguridad para la tabla document_shares
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios ver solo sus propios documentos compartidos
CREATE POLICY document_shares_select_policy ON document_shares
  FOR SELECT USING (auth.uid() = owner_id); -- Cambiado de user_id a owner_id

-- Política para permitir a los usuarios insertar sus propios documentos compartidos
CREATE POLICY document_shares_insert_policy ON document_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id); -- Cambiado de user_id a owner_id

-- Política para permitir a los usuarios actualizar sus propios documentos compartidos
CREATE POLICY document_shares_update_policy ON document_shares
  FOR UPDATE USING (auth.uid() = owner_id); -- Cambiado de user_id a owner_id

-- Política para permitir a los usuarios eliminar sus propios documentos compartidos
CREATE POLICY document_shares_delete_policy ON document_shares
  FOR DELETE USING (auth.uid() = owner_id); -- Cambiado de user_id a owner_id

-- Función para incrementar el contador de accesos
CREATE OR REPLACE FUNCTION increment_share_access_count(share_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE document_shares
  SET access_count = access_count + 1
  WHERE id = share_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_document_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_shares_updated_at
BEFORE UPDATE ON document_shares
FOR EACH ROW
EXECUTE FUNCTION update_document_shares_updated_at();
