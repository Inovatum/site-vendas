-- ============================================================================
-- LOJA DE ROUPAS - SCHEMA V6 CORRIGIDO
-- ============================================================================
-- EXECUÇÃO LIMPA SEM ERROS - INSTALA TUDO DO ZERO
-- ============================================================================

-- ============================================================================
-- ETAPA 1: LIMPEZA TOTAL (SEM ERROS)
-- ============================================================================

-- Remove funções primeiro (se existirem)
DROP FUNCTION IF EXISTS validate_admin_login(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS change_admin_password(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove tabelas (CASCADE remove políticas automaticamente)
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS store_customization CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================================
-- ETAPA 2: CRIAÇÃO DAS TABELAS
-- ============================================================================

-- TABELA: CATEGORIAS
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: PRODUTOS (COM 2 IMAGENS)
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  image_2 TEXT NULL,
  category TEXT NOT NULL,
  sizes TEXT[] DEFAULT NULL,
  colors TEXT[] DEFAULT NULL,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: CONFIGURAÇÕES DA LOJA
CREATE TABLE store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Loja Rafael',
  whatsapp_number TEXT NOT NULL DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  footer_text TEXT DEFAULT '© 2024 Loja Rafael. Todos os direitos reservados.',
  footer_company_name TEXT DEFAULT 'Loja Rafael',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: PERSONALIZAÇÃO VISUAL
CREATE TABLE store_customization (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL DEFAULT 1,
  primary_color TEXT NOT NULL DEFAULT '#e11d48',
  secondary_color TEXT NOT NULL DEFAULT '#f1f5f9',
  accent_color TEXT NOT NULL DEFAULT '#0f172a',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  button_color TEXT NOT NULL DEFAULT '#e11d48',
  button_text_color TEXT NOT NULL DEFAULT '#ffffff',
  site_background_color TEXT NOT NULL DEFAULT '#f8fafc',
  card_background_color TEXT NOT NULL DEFAULT '#ffffff',
  card_border_color TEXT NOT NULL DEFAULT '#e2e8f0',
  header_color TEXT NOT NULL DEFAULT '#ffffff',
  footer_color TEXT NOT NULL DEFAULT '#ffffff',
  cart_color TEXT NOT NULL DEFAULT '#ffffff',
  menu_color TEXT NOT NULL DEFAULT '#f8fafc',
  logo_url TEXT NULL,
  logo_size TEXT NOT NULL DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_store_name BOOLEAN NOT NULL DEFAULT true,
  theme_style TEXT NOT NULL DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  custom_css TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: USUÁRIOS ADMIN
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ETAPA 3: FUNÇÕES E TRIGGERS
-- ============================================================================

-- FUNÇÃO: ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at 
    BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_customization_updated_at 
    BEFORE UPDATE ON store_customization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ETAPA 4: FUNÇÕES DE AUTENTICAÇÃO
-- ============================================================================

-- FUNÇÃO: LOGIN
CREATE OR REPLACE FUNCTION validate_admin_login(
    p_username TEXT,
    p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    user_active BOOLEAN;
BEGIN
    SELECT password_hash, is_active 
    INTO stored_hash, user_active
    FROM admin_users 
    WHERE username = p_username;
    
    IF stored_hash IS NULL OR NOT user_active THEN
        RETURN FALSE;
    END IF;
    
    IF stored_hash = p_password THEN
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE username = p_username;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNÇÃO: MUDAR SENHA
CREATE OR REPLACE FUNCTION change_admin_password(
    p_username TEXT,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT validate_admin_login(p_username, p_old_password) THEN
        RETURN FALSE;
    END IF;
    
    UPDATE admin_users 
    SET password_hash = p_new_password,
        updated_at = NOW()
    WHERE username = p_username;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ETAPA 5: CONFIGURAR SEGURANÇA
-- ============================================================================

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_customization FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);

-- ============================================================================
-- ETAPA 6: INSERIR DADOS INICIAIS
-- ============================================================================

-- CONFIGURAÇÕES DA LOJA
INSERT INTO store_settings (
    id, store_name, whatsapp_number, footer_text, footer_company_name
) VALUES (
    1, 'Loja Rafael', '5511999999999', 
    '© 2024 Loja Rafael. Todos os direitos reservados.', 
    'Loja Rafael'
);

-- PERSONALIZAÇÃO VISUAL
INSERT INTO store_customization (
    id, store_id,
    primary_color, secondary_color, accent_color, background_color, text_color,
    button_color, button_text_color,
    site_background_color, card_background_color, card_border_color,
    header_color, footer_color, cart_color, menu_color,
    logo_size, show_logo, show_store_name, theme_style
) VALUES (
    1, 1,
    '#e11d48', '#f1f5f9', '#0f172a', '#ffffff', '#1f2937',
    '#e11d48', '#ffffff',
    '#f8fafc', '#ffffff', '#e2e8f0',
    '#ffffff', '#ffffff', '#ffffff', '#f8fafc',
    'medium', true, true, 'modern'
);

-- USUÁRIO ADMIN
INSERT INTO admin_users (username, password_hash, is_active) VALUES 
('admin', 'bella123', true);

-- CATEGORIAS
INSERT INTO categories (name, display_order, is_active) VALUES
('Blusas', 1, true),
('Camisas', 2, true),
('Vestidos', 3, true),
('Calças', 4, true),
('Perfumes', 5, true),
('Acessórios', 6, true),
('Sapatos', 7, true);

-- PRODUTOS DE EXEMPLO
INSERT INTO products (name, price, image, image_2, category, sizes, stock, status) VALUES
(
    'Blusa Floral Verão', 89.90, 
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', 
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500',
    'Blusas', ARRAY['P', 'M', 'G'], 10, 'active'
),
(
    'Camisa Social Branca', 129.90, 
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 
    'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=500',
    'Camisas', ARRAY['P', 'M', 'G', 'GG'], 15, 'active'
),
(
    'Vestido Longo Elegante', 199.90, 
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 
    'https://images.unsplash.com/photo-1594223700347-dd3ca1cf6faa?w=500',
    'Vestidos', ARRAY['P', 'M', 'G'], 8, 'active'
),
(
    'Calça Jeans Premium', 179.90, 
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
    'Calças', ARRAY['36', '38', '40', '42'], 12, 'active'
),
(
    'Perfume Floral Premium', 149.90, 
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', 
    NULL,
    'Perfumes', NULL, 20, 'active'
),
(
    'Bolsa Elegante', 89.90, 
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
    'Acessórios', NULL, 5, 'active'
);

-- ============================================================================
-- ETAPA 7: VERIFICAÇÃO
-- ============================================================================

-- Contar tudo
SELECT 
  'TABELAS CRIADAS' as tipo,
  COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'products', 'store_settings', 'store_customization', 'admin_users')

UNION ALL

SELECT 'CATEGORIAS', COUNT(*) FROM categories
UNION ALL
SELECT 'PRODUTOS', COUNT(*) FROM products  
UNION ALL
SELECT 'CONFIGURAÇÕES', COUNT(*) FROM store_settings
UNION ALL
SELECT 'PERSONALIZAÇÕES', COUNT(*) FROM store_customization
UNION ALL
SELECT 'USUÁRIOS ADMIN', COUNT(*) FROM admin_users;

-- ============================================================================
-- SUCESSO! BANCO INSTALADO
-- ============================================================================
-- Login: admin / bella123
-- Loja: Loja Rafael  
-- WhatsApp: 5511999999999
-- ============================================================================
