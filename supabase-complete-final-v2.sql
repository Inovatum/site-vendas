-- ============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS - SUPABASE (VERSÃO FINAL)
-- ============================================================================

-- Limpar dados existentes (opcional)
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS store_settings CASCADE;
-- DROP TABLE IF EXISTS store_customization CASCADE;

-- ============================================================================
-- 1. TABELA DE PRODUTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  sizes TEXT[], -- Array de tamanhos: ["P", "M", "G", "GG", "XG"]
  colors TEXT[], -- Array de cores: ["Branco", "Preto", "Azul"]
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABELA DE CONFIGURAÇÕES DA LOJA
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Minha Loja',
  whatsapp_number TEXT NOT NULL DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  footer_text TEXT DEFAULT '© 2024 Minha Loja. Todos os direitos reservados.',
  footer_company_name TEXT DEFAULT 'Minha Loja',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA DE CUSTOMIZAÇÃO VISUAL COMPLETA
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_customization (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL DEFAULT 1,
  
  -- Cores principais
  primary_color TEXT NOT NULL DEFAULT '#e11d48',
  secondary_color TEXT NOT NULL DEFAULT '#f1f5f9',
  accent_color TEXT NOT NULL DEFAULT '#0f172a',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  
  -- Cores dos botões
  button_color TEXT NOT NULL DEFAULT '#e11d48',
  button_text_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Cores do site e cards
  site_background_color TEXT NOT NULL DEFAULT '#f8fafc',
  card_background_color TEXT NOT NULL DEFAULT '#ffffff',
  card_border_color TEXT NOT NULL DEFAULT '#e2e8f0',
  
  -- Cores do header e footer (NOVO)
  header_color TEXT NOT NULL DEFAULT '#ffffff',
  footer_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Logo e identidade visual
  logo_url TEXT,
  logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')), -- NOVO
  show_logo BOOLEAN DEFAULT true,
  show_store_name BOOLEAN DEFAULT true,
  
  -- Tema e estilos
  theme_style TEXT DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para store_settings
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para store_customization
DROP TRIGGER IF EXISTS update_store_customization_updated_at ON store_customization;
CREATE TRIGGER update_store_customization_updated_at
    BEFORE UPDATE ON store_customization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;

-- Políticas para products (leitura e escrita públicas)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON products;
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON products;
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON products;
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- Políticas para store_settings (leitura e escrita públicas)
DROP POLICY IF EXISTS "Enable read access for all users" ON store_settings;
CREATE POLICY "Enable read access for all users" ON store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON store_settings;
CREATE POLICY "Enable insert for all users" ON store_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON store_settings;
CREATE POLICY "Enable update for all users" ON store_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON store_settings;
CREATE POLICY "Enable delete for all users" ON store_settings FOR DELETE USING (true);

-- Políticas para store_customization (leitura e escrita públicas)
DROP POLICY IF EXISTS "Enable read access for all users" ON store_customization;
CREATE POLICY "Enable read access for all users" ON store_customization FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON store_customization;
CREATE POLICY "Enable insert for all users" ON store_customization FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON store_customization;
CREATE POLICY "Enable update for all users" ON store_customization FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON store_customization;
CREATE POLICY "Enable delete for all users" ON store_customization FOR DELETE USING (true);

-- ============================================================================
-- 6. DADOS PADRÃO
-- ============================================================================

-- Configurações padrão da loja
INSERT INTO store_settings (store_name, whatsapp_number, footer_text, footer_company_name) 
VALUES ('Minha Loja', '5511999999999', '© 2024 Minha Loja. Todos os direitos reservados.', 'Minha Loja')
ON CONFLICT DO NOTHING;

-- Customização visual padrão COMPLETA
INSERT INTO store_customization (
  store_id, 
  primary_color, 
  secondary_color, 
  accent_color, 
  background_color, 
  text_color,
  button_color, 
  button_text_color,
  site_background_color,
  card_background_color,
  card_border_color,
  header_color,
  footer_color,
  logo_size,
  theme_style
) VALUES (
  1,
  '#e11d48',  -- Rosa/vermelho moderno
  '#f1f5f9',  -- Cinza claro
  '#0f172a',  -- Cinza escuro
  '#ffffff',  -- Branco
  '#1f2937',  -- Cinza texto
  '#e11d48',  -- Botão cor primária
  '#ffffff',  -- Texto botão branco
  '#f8fafc',  -- Fundo do site cinza muito claro
  '#ffffff',  -- Fundo dos cards branco
  '#e2e8f0',  -- Borda dos cards cinza claro
  '#ffffff',  -- Fundo do header branco
  '#ffffff',  -- Fundo do footer branco
  'medium',   -- Tamanho médio do logo
  'modern'
) ON CONFLICT DO NOTHING;

-- Produtos de exemplo
INSERT INTO products (name, price, image, category, sizes, colors, stock, status) VALUES
('Blusa Feminina Verde', 79.90, 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=300&h=400&fit=crop', 'Blusas', ARRAY['P', 'M', 'G'], ARRAY['Verde', 'Azul', 'Rosa'], 15, 'active'),
('Perfume Floral Dreams', 89.90, 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=300&h=400&fit=crop', 'Perfumes', NULL, ARRAY['Floral'], 8, 'active'),
('Camisa Listrada Masculina', 59.90, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=400&fit=crop', 'Camisas', ARRAY['P', 'M', 'G', 'GG'], ARRAY['Branco', 'Azul'], 23, 'active'),
('Perfume Luxury Gold', 129.90, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop', 'Perfumes', NULL, ARRAY['Amadeirado'], 5, 'active'),
('Vestido Floral Verão', 149.90, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop', 'Vestidos', ARRAY['P', 'M', 'G'], ARRAY['Floral', 'Rosa'], 12, 'active'),
('Calça Jeans Premium', 199.90, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop', 'Calças', ARRAY['36', '38', '40', '42'], ARRAY['Azul', 'Preto'], 7, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CONFIRMAÇÃO E FUNCIONALIDADES
-- ============================================================================
SELECT 'Setup completo realizado com sucesso!' as status;
SELECT 'Tabelas criadas: products, store_settings, store_customization' as info;
SELECT 'Funcionalidades: Cores completas, Logo com tamanhos, Header/Footer customizáveis' as features;
SELECT 'Dados padrão inseridos com sucesso!' as data_status;

-- ============================================================================
-- FUNCIONALIDADES IMPLEMENTADAS:
-- ============================================================================
-- ✅ Gestão completa de produtos com categorias, tamanhos e cores
-- ✅ Configurações da loja (nome, WhatsApp, rodapé customizável)
-- ✅ Sistema de cores completo:
--    - Cores principais (primária, secundária, destaque)
--    - Cores dos botões (fundo e texto)
--    - Cores do site (fundo geral)
--    - Cores dos cards (fundo e borda)
--    - Cores do header e footer (NOVO)
-- ✅ Logo configurável:
--    - Upload de imagem
--    - 3 tamanhos: pequeno (32px), médio (40px), grande (48px)
--    - Opção de mostrar/ocultar logo e nome da loja
-- ✅ Temas visuais (moderno, clássico, minimalista)
-- ✅ CSS personalizado
-- ✅ Rodapé configurável com texto e nome da empresa
-- ✅ Sistema de autenticação admin
-- ✅ Carrinho de compras com integração WhatsApp
-- ✅ Validação por categoria (roupas precisam de tamanho)
-- ✅ Sistema offline-first (só funciona com banco)
