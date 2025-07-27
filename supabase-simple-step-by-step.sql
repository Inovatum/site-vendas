-- ============================================================================
-- CRIAÇÃO STEP-BY-STEP - EXECUTE CADA BLOCO SEPARADAMENTE
-- ============================================================================
-- Se der erro, pare e me informe qual bloco falhou
-- ============================================================================

-- ============================================================================
-- PASSO 1: LIMPAR TUDO (EXECUTE PRIMEIRO)
-- ============================================================================

DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS store_customization CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================================
-- PASSO 2: CRIAR TABELA CATEGORIES (EXECUTE SEGUNDO)
-- ============================================================================

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSO 3: CRIAR TABELA PRODUCTS (EXECUTE TERCEIRO)
-- ============================================================================

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
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSO 4: CRIAR TABELA STORE_SETTINGS (EXECUTE QUARTO)
-- ============================================================================

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

-- ============================================================================
-- PASSO 5: CRIAR TABELA STORE_CUSTOMIZATION (EXECUTE QUINTO)
-- ============================================================================

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
  logo_size TEXT NOT NULL DEFAULT 'medium',
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_store_name BOOLEAN NOT NULL DEFAULT true,
  theme_style TEXT NOT NULL DEFAULT 'modern',
  custom_css TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PASSO 6: CRIAR TABELA ADMIN_USERS (EXECUTE SEXTO)
-- ============================================================================

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
-- PASSO 7: CONFIGURAR SEGURANÇA (EXECUTE SÉTIMO)
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_customization FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);

-- ============================================================================
-- PASSO 8: INSERIR DADOS (EXECUTE OITAVO)
-- ============================================================================

-- Configurações da loja
INSERT INTO store_settings (id, store_name, whatsapp_number) VALUES (1, 'Loja Rafael', '5511999999999');

-- Personalização
INSERT INTO store_customization (id, store_id, primary_color, button_color) VALUES (1, 1, '#e11d48', '#e11d48');

-- Admin
INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'bella123');

-- Categorias
INSERT INTO categories (name, display_order) VALUES 
('Blusas', 1), ('Camisas', 2), ('Vestidos', 3), ('Calças', 4), ('Perfumes', 5);

-- Produtos
INSERT INTO products (name, price, image, category, stock) VALUES 
('Blusa Teste', 89.90, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', 'Blusas', 10),
('Vestido Teste', 199.90, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 'Vestidos', 8);

-- ============================================================================
-- PASSO 9: VERIFICAR (EXECUTE NONO)
-- ============================================================================

SELECT 'categories' as tabela, COUNT(*) as registros FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL  
SELECT 'store_settings', COUNT(*) FROM store_settings
UNION ALL
SELECT 'store_customization', COUNT(*) FROM store_customization
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;
