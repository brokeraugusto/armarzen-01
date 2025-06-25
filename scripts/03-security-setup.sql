-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (store front)
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- Create policies for authenticated users (admin)
CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sales" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sale_items" ON sale_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage stock_movements" ON stock_movements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage webhook_settings" ON webhook_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view webhook_logs" ON webhook_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow public to create sales (for checkout)
CREATE POLICY "Public can create sales" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can create sale_items" ON sale_items
  FOR INSERT WITH CHECK (true);

-- Create functions for automation
CREATE OR REPLACE FUNCTION trigger_daily_summary()
RETURNS void AS $$
BEGIN
  PERFORM pg_notify('daily_summary', json_build_object(
    'event', 'daily_summary',
    'timestamp', NOW()
  )::text);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS void AS $$
DECLARE
  low_stock_product RECORD;
BEGIN
  FOR low_stock_product IN 
    SELECT id, name, stock_quantity, min_stock_level
    FROM products 
    WHERE stock_quantity <= min_stock_level 
    AND is_active = true
  LOOP
    PERFORM pg_notify('stock_alert', json_build_object(
      'event', 'stock_alert',
      'product_id', low_stock_product.id,
      'product_name', low_stock_product.name,
      'current_stock', low_stock_product.stock_quantity,
      'min_stock', low_stock_product.min_stock_level
    )::text);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update stock after sale
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Create stock movement record
  INSERT INTO stock_movements (product_id, movement_type, quantity, reason, reference_id)
  VALUES (NEW.product_id, 'sale', -NEW.quantity, 'Sale completed', NEW.sale_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after sale item is inserted
CREATE TRIGGER update_stock_after_sale_trigger
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_sale();
