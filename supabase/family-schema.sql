-- Tablas para la funcionalidad familiar

-- Tabla de miembros de familia
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  member_email TEXT NOT NULL,
  member_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  permissions JSONB DEFAULT '{"view_all": true, "download": false, "edit": false, "categories": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de documentos compartidos con familia
CREATE TABLE IF NOT EXISTS family_shared_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  document_id UUID REFERENCES documents NOT NULL,
  family_member_id UUID REFERENCES family_members NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, family_member_id)
);

-- Tabla de actividad de miembros de familia
CREATE TABLE IF NOT EXISTS family_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  family_member_id UUID REFERENCES family_members NOT NULL,
  document_id UUID REFERENCES documents,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para miembros de familia
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family members"
ON family_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members"
ON family_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
ON family_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
ON family_members FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para documentos compartidos con familia
ALTER TABLE family_shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shared documents"
ON family_shared_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared documents"
ON family_shared_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared documents"
ON family_shared_documents FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para actividad de miembros de familia
ALTER TABLE family_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family activity"
ON family_activity FOR SELECT
USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en family_members
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON family_members
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para registrar actividad cuando se comparte un documento
CREATE OR REPLACE FUNCTION add_family_share_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_activity (user_id, family_member_id, document_id, action, details)
  VALUES (
    NEW.user_id,
    NEW.family_member_id,
    NEW.document_id,
    'shared',
    'Documento compartido con miembro de familia'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_family_share_activity_trigger
AFTER INSERT ON family_shared_documents
FOR EACH ROW
EXECUTE FUNCTION add_family_share_activity();
