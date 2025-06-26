-- Verificar e corrigir a estrutura da tabela categories
DO $$
BEGIN
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar trigger para atualizar updated_at automaticamente
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
    
    -- Criar novo trigger
    CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Atualizar registros existentes
    UPDATE categories SET updated_at = created_at WHERE updated_at IS NULL;
END $$;
