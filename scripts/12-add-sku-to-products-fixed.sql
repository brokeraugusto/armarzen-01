-- Add SKU column to products table if it doesn't exist
DO $$
BEGIN
    -- Check if products table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Add SKU column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'sku'
        ) THEN
            ALTER TABLE products ADD COLUMN sku VARCHAR(100);
        END IF;

        -- Add image_url column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'image_url'
        ) THEN
            ALTER TABLE products ADD COLUMN image_url TEXT;
        END IF;

        -- Add supplier column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'supplier'
        ) THEN
            ALTER TABLE products ADD COLUMN supplier VARCHAR(255);
        END IF;

        -- Add notes column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'notes'
        ) THEN
            ALTER TABLE products ADD COLUMN notes TEXT;
        END IF;

        -- Add unique constraint for SKU if it doesn't exist
        BEGIN
            ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        -- Create index for SKU if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_sku') THEN
            CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
        END IF;

        -- Create index for barcode if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_barcode') THEN
            CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
        END IF;

        -- Create index for category_id if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category_id') THEN
            CREATE INDEX idx_products_category_id ON products(category_id);
        END IF;

        -- Create index for is_active if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_is_active') THEN
            CREATE INDEX idx_products_is_active ON products(is_active);
        END IF;

        -- Create index for stock_quantity if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_stock_quantity') THEN
            CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
        END IF;
    END IF;
END $$;

-- Update existing products to have auto-generated SKUs if they don't have one
DO $$
DECLARE
    product_record RECORD;
    new_sku VARCHAR(100);
    counter INTEGER := 1;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        FOR product_record IN 
            SELECT id, name FROM products WHERE sku IS NULL OR sku = ''
        LOOP
            -- Generate SKU based on product name and counter
            new_sku := 'SKU-' || LPAD(counter::text, 6, '0');
            
            -- Make sure SKU is unique
            WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku) LOOP
                counter := counter + 1;
                new_sku := 'SKU-' || LPAD(counter::text, 6, '0');
            END LOOP;
            
            -- Update product with new SKU
            UPDATE products SET sku = new_sku WHERE id = product_record.id;
            counter := counter + 1;
        END LOOP;
    END IF;
END $$;
