-- Verificar e corrigir a estrutura da tabela categories
DO $$
BEGIN
    -- Verificar se a tabela categories existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'categories' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;

        -- Atualizar registros existentes que não têm updated_at
        UPDATE categories SET updated_at = COALESCE(created_at, NOW()) WHERE updated_at IS NULL;
    END IF;
END $$;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver e criar novo
DO $$
BEGIN
    -- Remover trigger se existir
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
        DROP TRIGGER update_categories_updated_at ON categories;
    END IF;
    
    -- Criar novo trigger se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        CREATE TRIGGER update_categories_updated_at
            BEFORE UPDATE ON categories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
