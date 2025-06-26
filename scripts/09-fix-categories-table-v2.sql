-- Adicionar coluna updated_at se não existir
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualizar registros existentes que não têm updated_at
UPDATE categories 
SET updated_at = COALESCE(updated_at, created_at, NOW()) 
WHERE updated_at IS NULL;
