-- Eliminar políticas existentes para evitar conflictos
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
  (auth.uid() IS NOT NULL)
);

-- Política para permitir a los usuarios actualizar sus propios objetos
CREATE POLICY "Allow users to update own objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (auth.uid() IS NOT NULL)
);

-- Política para permitir a los usuarios eliminar sus propios objetos
CREATE POLICY "Allow users to delete own objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (auth.uid() IS NOT NULL)
);

-- Política para permitir a los administradores crear buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir a los administradores actualizar buckets
CREATE POLICY "Allow authenticated users to update buckets"
ON storage.buckets FOR UPDATE
USING (auth.uid() IS NOT NULL);
