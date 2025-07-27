-- ============================================================================
-- CRIAR SCHEMA COMPLETO - SCRIPT SEGURO PARA SUPABASE
-- ============================================================================
-- Execute este script no Supabase SQL Editor para criar todas as tabelas
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE CATEGORIAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABELA DE PRODUTOS (COM SEGUNDA IMAGEM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  image_2 TEXT, -- Segunda imagem (verso/lateral)
  category TEXT NOT NULL,
  sizes TEXT[], -- Array de tamanhos: ["P", "M", "G", "GG", "XG"]
  colors TEXT[], -- Array de cores: ["Branco", "Preto", "Azul"]
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA DE CONFIGURAÇÕES DA LOJA
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Loja Rafael',
  whatsapp_number TEXT NOT NULL DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  footer_text TEXT DEFAULT '© 2024 Loja Rafael. Todos os direitos reservados.',
  footer_company_name TEXT DEFAULT 'Loja Rafael',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TABELA DE CUSTOMIZAÇÃO VISUAL
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
  
  -- Cores do header e footer
  header_color TEXT NOT NULL DEFAULT '#ffffff',
  footer_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Cores do carrinho e menu
  cart_color TEXT NOT NULL DEFAULT '#ffffff',
  menu_color TEXT NOT NULL DEFAULT '#f8fafc',
  
  -- Logo e layout
  logo_url TEXT,
  logo_size TEXT NOT NULL DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_store_name BOOLEAN NOT NULL DEFAULT true,
  
  -- Tema e CSS personalizado
  theme_style TEXT NOT NULL DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA DE USUÁRIOS ADMINISTRATIVOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. FUNÇÕES PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_customization_updated_at ON store_customization;
CREATE TRIGGER update_store_customization_updated_at BEFORE UPDATE ON store_customization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. FUNÇÕES DE AUTENTICAÇÃO ADMINISTRATIVA
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_admin_login(
    p_username TEXT,
    p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    user_active BOOLEAN;
BEGIN
    -- Buscar hash da senha e status ativo
    SELECT password_hash, is_active 
    INTO stored_hash, user_active
    FROM admin_users 
    WHERE username = p_username;
    
    -- Verificar se usuário existe e está ativo
    IF stored_hash IS NULL OR NOT user_active THEN
        RETURN FALSE;
    END IF;
    
    -- Para esta versão, usamos verificação simples
    -- Em produção, usar crypt() com bcrypt
    IF stored_hash = p_password THEN
        -- Atualizar último login
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE username = p_username;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION change_admin_password(
    p_username TEXT,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar senha atual
    IF NOT validate_admin_login(p_username, p_old_password) THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar senha (em produção, usar hash apropriado)
    UPDATE admin_users 
    SET password_hash = p_new_password,
        updated_at = NOW()
    WHERE username = p_username;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. PERMISSÕES E POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
-- ATENÇÃO: Em produção, criar políticas mais restritivas

DROP POLICY IF EXISTS "Allow all operations" ON categories;
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON products;
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON store_settings;
CREATE POLICY "Allow all operations" ON store_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON store_customization;
CREATE POLICY "Allow all operations" ON store_customization FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON admin_users;
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);

-- ============================================================================
-- 9. DADOS INICIAIS (SEEDS)
-- ============================================================================

-- Configurações iniciais da loja
INSERT INTO store_settings (store_name, whatsapp_number, footer_text, footer_company_name) 
VALUES ('Loja Rafael', '5511999999999', '© 2024 Loja Rafael. Todos os direitos reservados.', 'Loja Rafael')
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  whatsapp_number = EXCLUDED.whatsapp_number,
  footer_text = EXCLUDED.footer_text,
  footer_company_name = EXCLUDED.footer_company_name;

-- Customização padrão
INSERT INTO store_customization (
    store_id, primary_color, secondary_color, accent_color,
    background_color, text_color, button_color, button_text_color,
    site_background_color, card_background_color, card_border_color,
    header_color, footer_color, cart_color, menu_color,
    logo_size, show_logo, show_store_name, theme_style
) VALUES (
    1, '#e11d48', '#f1f5f9', '#0f172a',
    '#ffffff', '#1f2937', '#e11d48', '#ffffff',
    '#f8fafc', '#ffffff', '#e2e8f0',
    '#ffffff', '#ffffff', '#ffffff', '#f8fafc',
    'medium', true, true, 'modern'
)
ON CONFLICT (id) DO UPDATE SET
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color,
  background_color = EXCLUDED.background_color,
  text_color = EXCLUDED.text_color,
  button_color = EXCLUDED.button_color,
  button_text_color = EXCLUDED.button_text_color,
  site_background_color = EXCLUDED.site_background_color,
  card_background_color = EXCLUDED.card_background_color,
  card_border_color = EXCLUDED.card_border_color,
  header_color = EXCLUDED.header_color,
  footer_color = EXCLUDED.footer_color,
  cart_color = EXCLUDED.cart_color,
  menu_color = EXCLUDED.menu_color,
  logo_size = EXCLUDED.logo_size,
  show_logo = EXCLUDED.show_logo,
  show_store_name = EXCLUDED.show_store_name,
  theme_style = EXCLUDED.theme_style;

-- Usuário administrativo padrão
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', 'bella123')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- Categorias padrão
INSERT INTO categories (name, display_order) VALUES
('Blusas', 1),
('Camisas', 2),
('Vestidos', 3),
('Calças', 4),
('Perfumes', 5),
('Acessórios', 6),
('Sapatos', 7)
ON CONFLICT (name) DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- Produtos de exemplo com duas imagens
INSERT INTO products (name, price, image, image_2, category, sizes, stock, status) VALUES
('Blusa Floral Verão', 89.90, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500', 'Blusas', ARRAY['P', 'M', 'G'], 10, 'active'),
('Camisa Social Branca', 129.90, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=500', 'Camisas', ARRAY['P', 'M', 'G', 'GG'], 15, 'active'),
('Vestido Longo Elegante', 199.90, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 'https://images.unsplash.com/photo-1594223700347-dd3ca1cf6faa?w=500', 'Vestidos', ARRAY['P', 'M', 'G'], 8, 'active'),
('Perfume Floral Premium', 149.90, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', NULL, 'Perfumes', NULL, 20, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'products', 'store_settings', 'store_customization', 'admin_users')
ORDER BY tablename;

-- ============================================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- ============================================================================
