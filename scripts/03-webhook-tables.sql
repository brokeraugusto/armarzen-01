-- Webhook logs table
CREATE TABLE webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  webhook_url TEXT NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook failures table for retry mechanism
CREATE TABLE webhook_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payload JSONB NOT NULL,
  error TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default webhook settings
INSERT INTO webhook_settings (event_type, webhook_url, is_active) VALUES 
('stock_alert', 'https://your-n8n-instance.com/webhook/stock-alert', true),
('sale_completed', 'https://your-n8n-instance.com/webhook/sale-completed', true),
('daily_summary', 'https://your-n8n-instance.com/webhook/daily-summary', true);
