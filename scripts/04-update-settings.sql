-- Adicionar configurações de webhook e n8n
INSERT INTO settings (key, value, description) VALUES 
('n8n_base_url', '', 'URL base da instância N8N'),
('n8n_webhook_token', '', 'Token de autenticação para webhooks N8N'),
('whatsapp_phone', '', 'Número do WhatsApp para notificações (com DDI)'),
('stock_alert_webhook', '', 'URL do webhook para alertas de estoque'),
('sale_webhook', '', 'URL do webhook para vendas concluídas'),
('daily_summary_webhook', '', 'URL do webhook para resumo diário')
ON CONFLICT (key) DO NOTHING;

-- Atualizar dados de exemplo das categorias com cores que remetem a ar, mar e zen
UPDATE categories SET 
  color = CASE 
    WHEN name = 'Bebidas' THEN '#0EA5E9'  -- Sky blue (mar)
    WHEN name = 'Snacks' THEN '#14B8A6'   -- Teal (zen)
    WHEN name = 'Doces' THEN '#10B981'    -- Emerald (natureza)
    WHEN name = 'Higiene' THEN '#06B6D4'  -- Cyan (ar)
    WHEN name = 'Eletrônicos' THEN '#8B5CF6' -- Purple (tecnologia zen)
    ELSE color
  END;
