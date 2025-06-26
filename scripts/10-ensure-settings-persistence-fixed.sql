-- Ensure all settings persist correctly
DO $$
BEGIN
    -- Verificar se a tabela settings existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Update existing settings that don't have updated_at
        UPDATE settings 
        SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
        WHERE updated_at IS NULL;
    END IF;

    -- Verificar se a tabela products existe antes de adicionar constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Add constraints only if they don't exist
        BEGIN
            ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price >= 0);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER TABLE products ADD CONSTRAINT products_cost_price_positive CHECK (cost_price >= 0);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER TABLE products ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER TABLE products ADD CONSTRAINT products_min_stock_level_non_negative CHECK (min_stock_level >= 0);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;

    -- Verificar se a tabela categories existe antes de adicionar constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        BEGIN
            ALTER TABLE categories ADD CONSTRAINT categories_name_not_empty CHECK (length(trim(name)) > 0);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for settings table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Remove existing trigger if it exists
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at') THEN
            DROP TRIGGER update_settings_updated_at ON settings;
        END IF;
        
        -- Create new trigger
        CREATE TRIGGER update_settings_updated_at
            BEFORE UPDATE ON settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add indexes for better performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Create indexes only if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_settings_key') THEN
            CREATE INDEX idx_settings_key ON settings(key);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_settings_updated_at') THEN
            CREATE INDEX idx_settings_updated_at ON settings(updated_at);
        END IF;
    END IF;
END $$;
