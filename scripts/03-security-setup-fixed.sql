-- Enable RLS (Row Level Security) - only if not already enabled
DO $$
BEGIN
    -- Enable RLS for tables if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'products' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'categories' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'sales' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'sale_items' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'stock_movements' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'settings' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'webhook_settings' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'webhook_logs' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Products policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public can view active products') THEN
        CREATE POLICY "Public can view active products" ON products
          FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Authenticated users can manage products') THEN
        CREATE POLICY "Authenticated users can manage products" ON products
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public can view active categories') THEN
        CREATE POLICY "Public can view active categories" ON categories
          FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Authenticated users can manage categories') THEN
        CREATE POLICY "Authenticated users can manage categories" ON categories
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Sales policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Authenticated users can manage sales') THEN
        CREATE POLICY "Authenticated users can manage sales" ON sales
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Public can create sales') THEN
        CREATE POLICY "Public can create sales" ON sales
          FOR INSERT WITH CHECK (true);
    END IF;

    -- Sale items policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Authenticated users can manage sale_items') THEN
        CREATE POLICY "Authenticated users can manage sale_items" ON sale_items
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Public can create sale_items') THEN
        CREATE POLICY "Public can create sale_items" ON sale_items
          FOR INSERT WITH CHECK (true);
    END IF;

    -- Stock movements policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'Authenticated users can manage stock_movements') THEN
        CREATE POLICY "Authenticated users can manage stock_movements" ON stock_movements
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Authenticated users can manage settings') THEN
        CREATE POLICY "Authenticated users can manage settings" ON settings
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Webhook settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_settings' AND policyname = 'Authenticated users can manage webhook_settings') THEN
        CREATE POLICY "Authenticated users can manage webhook_settings" ON webhook_settings
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Webhook logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'Authenticated users can view webhook_logs') THEN
        CREATE POLICY "Authenticated users can view webhook_logs" ON webhook_logs
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

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

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_after_sale_trigger') THEN
        CREATE TRIGGER update_stock_after_sale_trigger
          AFTER INSERT ON sale_items
          FOR EACH ROW
          EXECUTE FUNCTION update_stock_after_sale();
    END IF;
END $$;
