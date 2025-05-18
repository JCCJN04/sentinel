-- Create tables for DocuVault

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'es',
  timezone TEXT DEFAULT 'America/Mexico_City',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  date DATE NOT NULL,
  expiry_date DATE,
  provider TEXT,
  amount TEXT,
  currency TEXT,
  status TEXT NOT NULL DEFAULT 'vigente',
  notes TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document shares table
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
  shared_with TEXT,
  expiry_date DATE,
  permissions JSONB DEFAULT '{"view": true, "download": false, "print": false, "edit": false}',
  share_method TEXT NOT NULL,
  password TEXT,
  access_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document history table
CREATE TABLE IF NOT EXISTS document_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document annotations table
CREATE TABLE IF NOT EXISTS document_annotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document reminders table
CREATE TABLE IF NOT EXISTS document_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  priority TEXT DEFAULT 'media',
  status TEXT DEFAULT 'pendiente',
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Documents policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Document shares policies
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for their documents"
  ON document_shares FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_shares.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert shares for their documents"
  ON document_shares FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_shares.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update shares for their documents"
  ON document_shares FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_shares.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete shares for their documents"
  ON document_shares FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_shares.document_id
    AND documents.user_id = auth.uid()
  ));

-- Document history policies
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for their documents"
  ON document_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_history.document_id
    AND documents.user_id = auth.uid()
  ));

-- Document annotations policies
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view annotations for their documents"
  ON document_annotations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_annotations.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert annotations for their documents"
  ON document_annotations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_annotations.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own annotations"
  ON document_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON document_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- Document reminders policies
ALTER TABLE document_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders for their documents"
  ON document_reminders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_reminders.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reminders for their documents"
  ON document_reminders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_reminders.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update reminders for their documents"
  ON document_reminders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_reminders.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete reminders for their documents"
  ON document_reminders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_reminders.document_id
    AND documents.user_id = auth.uid()
  ));

-- Create triggers for updated_at

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger for documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger for document_shares
CREATE TRIGGER update_document_shares_updated_at
BEFORE UPDATE ON document_shares
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger for document_annotations
CREATE TRIGGER update_document_annotations_updated_at
BEFORE UPDATE ON document_annotations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create trigger to add history entry when document is created, updated, or deleted

-- Function to add history entry
CREATE OR REPLACE FUNCTION add_document_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_history (document_id, action, user_id)
    VALUES (NEW.id, 'created', NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO document_history (document_id, action, details, user_id)
    VALUES (NEW.id, 'edited', 'Documento actualizado', NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO document_history (document_id, action, user_id)
    VALUES (OLD.id, 'deleted', OLD.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document history
CREATE TRIGGER add_document_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION add_document_history();

-- Create trigger to add history entry when document is shared

-- Function to add share history entry
CREATE OR REPLACE FUNCTION add_document_share_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_history (document_id, action, details, user_id)
  SELECT NEW.document_id, 'shared', 'Compartido con ' || NEW.shared_with, documents.user_id
  FROM documents
  WHERE documents.id = NEW.document_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document share history
CREATE TRIGGER add_document_share_history_trigger
AFTER INSERT ON document_shares
FOR EACH ROW
EXECUTE FUNCTION add_document_share_history();
