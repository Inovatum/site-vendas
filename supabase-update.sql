-- Script SQL adicional para atualizar o banco (execute após o supabase-setup.sql)
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar tabela de configurações da loja (se não existir)
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name VARCHAR(255) DEFAULT 'Minha Loja',
  whatsapp_number VARCHAR(20) DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão (se não existir)
INSERT INTO store_settings (store_name, whatsapp_number, monthly_sales) 
SELECT 'Minha Loja', '5511999999999', 0
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Habilitar RLS na tabela de configurações
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações da loja
CREATE POLICY IF NOT EXISTS "Enable read access for all users on settings" ON store_settings
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable write access for authenticated users on settings" ON store_settings
FOR ALL USING (true);

-- Função para atualizar o campo updated_at na tabela de configurações
CREATE TRIGGER IF NOT EXISTS update_store_settings_updated_at 
    BEFORE UPDATE ON store_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
