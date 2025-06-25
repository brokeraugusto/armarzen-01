-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES 
('Bebidas', 'Refrigerantes, sucos e águas', '🥤', '#0EA5E9'),
('Snacks', 'Salgadinhos e petiscos', '🍿', '#14B8A6'),
('Doces', 'Chocolates e balas', '🍫', '#10B981'),
('Higiene', 'Produtos de limpeza e higiene', '🧼', '#06B6D4'),
('Eletrônicos', 'Acessórios e gadgets', '📱', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock_level, category_id, barcode) 
SELECT 
  'Coca-Cola 350ml', 'Refrigerante de cola', 4.50, 2.80, 50, 10, c.id, '7894900011517'
FROM categories c WHERE c.name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock_level, category_id, barcode) 
SELECT 
  'Água Mineral 500ml', 'Água mineral natural', 2.00, 1.20, 100, 20, c.id, '7891234567890'
FROM categories c WHERE c.name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock_level, category_id, barcode) 
SELECT 
  'Chips Batata 100g', 'Batata frita crocante', 6.90, 4.20, 30, 5, c.id, '7891000100103'
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock_level, category_id, barcode) 
SELECT 
  'Chocolate ao Leite', 'Chocolate cremoso 90g', 8.50, 5.30, 25, 5, c.id, '7622210951045'
FROM categories c WHERE c.name = 'Doces'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock_level, category_id, barcode) 
SELECT 
  'Cabo USB-C', 'Cabo de carregamento 1m', 15.90, 8.50, 15, 3, c.id, '1234567890123'
FROM categories c WHERE c.name = 'Eletrônicos'
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
('store_name', 'ArMarZen', 'Nome da loja'),
('store_phone', '(11) 99999-9999', 'Telefone da loja'),
('store_email', 'contato@armarzen.com', 'Email da loja'),
('tax_rate', '0.00', 'Taxa de imposto padrão'),
('currency', 'BRL', 'Moeda padrão'),
('store_logo', '/images/armarzen-logo.png', 'Logo da loja'),
('n8n_base_url', '', 'URL base da instância N8N'),
('n8n_webhook_token', '', 'Token de autenticação para webhooks N8N'),
('whatsapp_phone', '', 'Número do WhatsApp para notificações (com DDI)'),
('stock_alert_webhook', '', 'URL do webhook para alertas de estoque'),
('sale_webhook', '', 'URL do webhook para vendas concluídas'),
('daily_summary_webhook', '', 'URL do webhook para resumo diário')
ON CONFLICT (key) DO NOTHING;

-- Insert default webhook settings
INSERT INTO webhook_settings (event_type, webhook_url, is_active) VALUES 
('stock_alert', 'https://your-n8n-instance.com/webhook/stock-alert', false),
('sale_completed', 'https://your-n8n-instance.com/webhook/sale-completed', false),
('daily_summary', 'https://your-n8n-instance.com/webhook/daily-summary', false)
ON CONFLICT DO NOTHING;
