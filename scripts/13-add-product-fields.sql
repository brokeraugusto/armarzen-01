-- Add additional fields to products table
DO $$
BEGIN
  -- Add supplier column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier') THEN
    ALTER TABLE products ADD COLUMN supplier TEXT;
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'notes') THEN
    ALTER TABLE products ADD COLUMN notes TEXT;
  END IF;

  -- Add sku column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE products ADD COLUMN sku TEXT;
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_supplier ON products(supplier) WHERE supplier IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_stock ON products(is_active, stock_quantity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);

-- Add unique constraints
DO $$
BEGIN
  -- Add unique constraint for SKU if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_sku_unique' AND table_name = 'products') THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Generate SKUs for existing products without one
UPDATE products 
SET sku = UPPER(SUBSTRING(name FROM 1 FOR 3)) || EXTRACT(EPOCH FROM created_at)::TEXT
WHERE sku IS NULL OR sku = '';

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product images
DO $$
BEGIN
  -- Policy for public read access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view product images' AND tablename = 'objects') THEN
    CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');
  END IF;

  -- Policy for authenticated users to upload
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;

  -- Policy for authenticated users to update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can update product images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;

  -- Policy for authenticated users to delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete product images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can delete product images" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create function to automatically generate SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := UPPER(SUBSTRING(NEW.name FROM 1 FOR 3)) || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate SKU
DROP TRIGGER IF EXISTS trigger_generate_product_sku ON products;
CREATE TRIGGER trigger_generate_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();

-- Add check constraints
DO $$
BEGIN
  -- Ensure price is positive
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_price_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);
  END IF;

  -- Ensure cost_price is non-negative
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_cost_price_non_negative') THEN
    ALTER TABLE products ADD CONSTRAINT products_cost_price_non_negative CHECK (cost_price >= 0);
  END IF;

  -- Ensure stock_quantity is non-negative
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_stock_quantity_non_negative') THEN
    ALTER TABLE products ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0);
  END IF;

  -- Ensure min_stock_level is non-negative
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_min_stock_level_non_negative') THEN
    ALTER TABLE products ADD CONSTRAINT products_min_stock_level_non_negative CHECK (min_stock_level >= 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Create view for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.*,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true 
  AND p.stock_quantity <= p.min_stock_level;

-- Create view for product statistics
CREATE OR REPLACE VIEW product_statistics AS
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_products,
  COUNT(*) FILTER (WHERE stock_quantity <= min_stock_level AND is_active = true) as low_stock_products,
  AVG(price) as average_price,
  SUM(stock_quantity * cost_price) as total_inventory_value,
  SUM(stock_quantity * price) as total_retail_value
FROM products;

-- Grant necessary permissions
GRANT SELECT ON low_stock_products TO authenticated;
GRANT SELECT ON product_statistics TO authenticated;
