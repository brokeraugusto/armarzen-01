-- Ensure all settings persist correctly
-- Add updated_at triggers for all configuration tables

-- Update settings table to ensure proper timestamps
ALTER TABLE IF EXISTS settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure all existing settings have updated_at
UPDATE settings 
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);

-- Ensure products table has proper constraints
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS products_price_positive CHECK (price >= 0),
ADD CONSTRAINT IF NOT EXISTS products_cost_price_positive CHECK (cost_price >= 0),
ADD CONSTRAINT IF NOT EXISTS products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
ADD CONSTRAINT IF NOT EXISTS products_min_stock_level_non_negative CHECK (min_stock_level >= 0);

-- Ensure categories table has proper constraints  
ALTER TABLE categories
ADD CONSTRAINT IF NOT EXISTS categories_name_not_empty CHECK (length(trim(name)) > 0);

-- Add RLS policies if not exists
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DO $$
BEGIN
    -- Settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow authenticated users full access') THEN
        CREATE POLICY "Allow authenticated users full access" ON settings
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Products policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated users full access') THEN
        CREATE POLICY "Allow authenticated users full access" ON products
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow authenticated users full access') THEN
        CREATE POLICY "Allow authenticated users full access" ON categories
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END
$$;
