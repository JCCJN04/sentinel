-- Función para encontrar documentos relacionados basados en etiquetas comunes
CREATE OR REPLACE FUNCTION find_related_documents(p_document_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  tags TEXT[],
  file_type TEXT,
  file_url TEXT,
  similarity_score FLOAT
) AS $$
DECLARE
  v_tags TEXT[];
  v_user_id UUID;
BEGIN
  -- Obtener etiquetas y usuario del documento actual
  SELECT tags, user_id INTO v_tags, v_user_id
  FROM documents
  WHERE id = p_document_id;
  
  -- Si no hay etiquetas, devolver conjunto vacío
  IF v_tags IS NULL OR array_length(v_tags, 1) IS NULL THEN
    RETURN;
  END IF;
  
  -- Encontrar documentos con etiquetas similares
  RETURN QUERY
  WITH doc_tags AS (
    SELECT 
      d.id,
      d.name,
      d.category,
      d.tags,
      d.file_type,
      d.file_path,
      -- Calcular puntuación de similitud basada en etiquetas comunes
      (
        SELECT COUNT(*)::FLOAT / GREATEST(array_length(v_tags, 1), array_length(d.tags, 1))
        FROM unnest(v_tags) t1
        WHERE t1 = ANY(d.tags)
      ) AS similarity_score
    FROM documents d
    WHERE 
      d.user_id = v_user_id AND
      d.id != p_document_id AND
      d.tags && v_tags -- Operador de superposición de arrays
  )
  SELECT 
    dt.id,
    dt.name,
    dt.category,
    dt.tags,
    dt.file_type,
    (SELECT public_url FROM storage.objects WHERE name = dt.file_path LIMIT 1) AS file_url,
    dt.similarity_score
  FROM doc_tags dt
  WHERE dt.similarity_score > 0
  ORDER BY dt.similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
