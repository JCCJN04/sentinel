-- Verificar si la tabla existe y crearla si no existe
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  share_type TEXT NOT NULL DEFAULT 'link',
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false, "print": false, "edit": false}',
  password TEXT,
  recipients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Verificar si la columna share_type existe y agregarla si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'document_shares' AND column_name = 'share_type'
  ) THEN
    ALTER TABLE document_shares ADD COLUMN share_type TEXT NOT NULL DEFAULT 'link';
  END IF;
END
$$;

-- Verificar si la columna expires_at existe y agregarla si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'document_shares' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE document_shares ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

-- Verificar si la columna permissions existe y agregarla si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'document_shares' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE document_shares ADD COLUMN permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false, "print": false, "edit": false}';
  END IF;
END
$$;

-- Verificar si la columna recipients existe y agregarla si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'document_shares' AND column_name = 'recipients'
  ) THEN
    ALTER TABLE document_shares ADD COLUMN recipients TEXT[];
  END IF;
END
$$;

-- Añadir políticas RLS para document_shares
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios ver sus propios compartidos
DROP POLICY IF EXISTS "Users can view their own shares" ON document_shares;
CREATE POLICY "Users can view their own shares"
ON document_shares FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir a los usuarios insertar sus propios compartidos
DROP POLICY IF EXISTS "Users can insert their own shares" ON document_shares;
CREATE POLICY "Users can insert their own shares"
ON document_shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir a los usuarios actualizar sus propios compartidos
DROP POLICY IF EXISTS "Users can update their own shares" ON document_shares;
CREATE POLICY "Users can update their own shares"
ON document_shares FOR UPDATE
USING (auth.uid() = user_id);

-- Política para permitir a los usuarios eliminar sus propios compartidos
DROP POLICY IF EXISTS "Users can delete their own shares" ON document_shares;
CREATE POLICY "Users can delete their own shares"
ON document_shares FOR DELETE
USING (auth.uid() = user_id);
