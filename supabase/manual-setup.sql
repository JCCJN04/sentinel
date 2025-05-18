-- IMPORTANTE: Este script debe ejecutarse manualmente desde el panel de administración de Supabase

-- 1. Crear el bucket de documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de almacenamiento
-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow individual storage access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own objects" ON storage.objects;

-- Política para permitir a los usuarios leer cualquier objeto (necesario para URLs públicas)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Política para permitir a los usuarios insertar objetos en su propia carpeta
CREATE POLICY "Allow users to upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir a los usuarios actualizar sus propios objetos
CREATE POLICY "Allow users to update own objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir a los usuarios eliminar sus propios objetos
CREATE POLICY "Allow users to delete own objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Verificar que las políticas de RLS estén habilitadas para las tablas
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_activity ENABLE ROW LEVEL SECURITY;

-- 4. Verificar las políticas de RLS para la tabla documents
CREATE POLICY IF NOT EXISTS "Users can view their own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own documents"
ON documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own documents"
ON documents FOR DELETE
USING (auth.uid() = user_id);
