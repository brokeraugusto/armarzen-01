-- Create function for daily summary
CREATE OR REPLACE FUNCTION trigger_daily_summary()
RETURNS void AS $$
BEGIN
  -- This function would be called by a cron job
  -- For now, it's a placeholder that could trigger the webhook
  PERFORM pg_notify('daily_summary', json_build_object(
    'event', 'daily_summary',
    'timestamp', NOW()
  )::text);
END;
$$ LANGUAGE plpgsql;

-- Create function for stock alerts
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_stock_level ON products(stock_quantity, min_stock_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
