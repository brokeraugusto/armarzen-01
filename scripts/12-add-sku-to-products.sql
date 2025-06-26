-- Add SKU column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;

-- Create index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Add comment
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - código interno do produto';
