-- Función para ejecutar SQL dinámico
CREATE OR REPLACE FUNCTION run_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE query;
  RETURN '{"success": true}'::JSONB;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Función para ejecutar SQL dinámico y devolver resultados
CREATE OR REPLACE FUNCTION run_sql_with_results(query text)
RETURNS TABLE(rows JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error executing SQL: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;
