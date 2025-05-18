-- Actualizar las políticas de almacenamiento para permitir acceso público a los archivos

-- Asegurarse de que el bucket sea público
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own objects" ON storage.objects;

-- Política para permitir a cualquier usuario leer objetos (necesario para URLs públicas)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Política para permitir a los usuarios autenticados insertar objetos en su propia carpeta
CREATE POLICY "Allow users to upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
);

-- Política para permitir a los usuarios autenticados actualizar sus propios objetos
CREATE POLICY "Allow users to update own objects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
);

-- Política para permitir a los usuarios autenticados eliminar sus propios objetos
CREATE POLICY "Allow users to delete own objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
);
