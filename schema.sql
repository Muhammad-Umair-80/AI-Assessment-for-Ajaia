-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Document Shares Table
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_document_user_share UNIQUE (document_id, user_id)
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user_id ON document_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);

-- 5. Updated_at Trigger for Documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Seed Users (Deterministic UUIDs & safe to run repeatedly)
INSERT INTO users (id, name, email) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Muhammad Umair', '44muhammadumair@gmail.com'),
    ('00000000-0000-0000-0000-000000000002', 'Alex Rivera', 'alex@example.com'),
    ('00000000-0000-0000-0000-000000000003', 'Sam Taylor', 'sam@example.com')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
