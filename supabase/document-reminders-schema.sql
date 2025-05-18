-- Crear la tabla de recordatorios de documentos
CREATE TABLE IF NOT EXISTS document_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  priority TEXT CHECK (priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
  status TEXT CHECK (status IN ('pendiente', 'completada', 'pospuesta')) DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS document_reminders_user_id_idx ON document_reminders(user_id);
CREATE INDEX IF NOT EXISTS document_reminders_document_id_idx ON document_reminders(document_id);
CREATE INDEX IF NOT EXISTS document_reminders_date_idx ON document_reminders(date);
CREATE INDEX IF NOT EXISTS document_reminders_status_idx ON document_reminders(status);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_document_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp de updated_at
DROP TRIGGER IF EXISTS update_document_reminders_updated_at ON document_reminders;
CREATE TRIGGER update_document_reminders_updated_at
BEFORE UPDATE ON document_reminders
FOR EACH ROW
EXECUTE FUNCTION update_document_reminders_updated_at();

-- Políticas RLS para la tabla de recordatorios
ALTER TABLE document_reminders ENABLE ROW LEVEL SECURITY;

-- Política para permitir a los usuarios ver solo sus propios recordatorios
CREATE POLICY "Users can view their own reminders"
ON document_reminders FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir a los usuarios insertar sus propios recordatorios
CREATE POLICY "Users can insert their own reminders"
ON document_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir a los usuarios actualizar sus propios recordatorios
CREATE POLICY "Users can update their own reminders"
ON document_reminders FOR UPDATE
USING (auth.uid() = user_id);

-- Política para permitir a los usuarios eliminar sus propios recordatorios
CREATE POLICY "Users can delete their own reminders"
ON document_reminders FOR DELETE
USING (auth.uid() = user_id);
