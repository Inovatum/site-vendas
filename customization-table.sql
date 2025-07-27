-- Query SQL para criar tabela de personalização visual
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de personalização (se não existir)
CREATE TABLE IF NOT EXISTS store_customization (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER DEFAULT 1,
  
  -- Cores principais
  primary_color VARCHAR(7) DEFAULT '#e11d48',
  secondary_color VARCHAR(7) DEFAULT '#f1f5f9', 
  accent_color VARCHAR(7) DEFAULT '#0f172a',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#1f2937',
  
  -- Cores dos botões
  button_color VARCHAR(7) DEFAULT '#e11d48',
  button_text_color VARCHAR(7) DEFAULT '#ffffff',
  
  -- Logo e branding
  logo_url TEXT,
  show_logo BOOLEAN DEFAULT true,
  show_store_name BOOLEAN DEFAULT true,
  
  -- Estilo do tema
  theme_style VARCHAR(20) DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  
  -- CSS personalizado
  custom_css TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão (se não existir)
INSERT INTO store_customization (
  store_id,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  button_color,
  button_text_color,
  show_logo,
  show_store_name,
  theme_style
) 
SELECT 
  1,
  '#e11d48',
  '#f1f5f9',
  '#0f172a', 
  '#ffffff',
  '#1f2937',
  '#e11d48',
  '#ffffff',
  true,
  true,
  'modern'
WHERE NOT EXISTS (SELECT 1 FROM store_customization WHERE store_id = 1);

-- Habilitar RLS (Row Level Security)
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY IF NOT EXISTS "Enable read access for all users on customization" 
ON store_customization FOR SELECT USING (true);

-- Política para escrita (ajuste conforme necessário)
CREATE POLICY IF NOT EXISTS "Enable write access for authenticated users on customization" 
ON store_customization FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_customization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_store_customization_updated_at 
    BEFORE UPDATE ON store_customization 
    FOR EACH ROW 
    EXECUTE FUNCTION update_customization_updated_at();

-- Consulta para verificar dados
SELECT * FROM store_customization WHERE store_id = 1;
