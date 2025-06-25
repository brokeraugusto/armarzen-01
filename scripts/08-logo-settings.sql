-- Adicionar configuração do logo
INSERT INTO settings (key, value, description) VALUES 
('store_logo', '/images/armarzen-logo.png', 'Logo da loja')
ON CONFLICT (key) DO NOTHING;

-- Criar bucket para assets no Supabase Storage (se necessário)
-- Este comando deve ser executado no painel do Supabase ou via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);
