-- Execute este script para corrigir a tabela de configurações
-- Copie e cole no SQL Editor do Supabase

-- Criar tabela de configurações (se não existir)
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name VARCHAR(255) DEFAULT 'Minha Loja',
  whatsapp_number VARCHAR(20) DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados padrão (se a tabela estiver vazia)
INSERT INTO store_settings (store_name, whatsapp_number, monthly_sales) 
SELECT 'Minha Loja', '5511999999999', 0
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);

-- Habilitar RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
DROP POLICY IF EXISTS "Enable read access for all users on settings" ON store_settings;
CREATE POLICY "Enable read access for all users on settings" ON store_settings
FOR SELECT USING (true);

-- Política de escrita para todos (sistema simples)
DROP POLICY IF EXISTS "Enable write access for authenticated users on settings" ON store_settings;
CREATE POLICY "Enable write access for authenticated users on settings" ON store_settings
FOR ALL USING (true);
