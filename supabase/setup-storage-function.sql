-- Función para configurar las políticas de almacenamiento
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear el bucket de documentos si no existe
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;

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
END;
$$;
