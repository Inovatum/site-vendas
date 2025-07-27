-- ============================================================================
-- SQL MÍNIMO - APENAS O ESSENCIAL PARA FUNCIONAR
-- ============================================================================
-- Execute este bloco inteiro de uma vez
-- ============================================================================

-- Limpar
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS store_customization CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Criar categorias
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar produtos
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  image_2 TEXT,
  category TEXT NOT NULL,
  sizes TEXT[],
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar configurações
CREATE TABLE store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name TEXT DEFAULT 'Loja Rafael',
  whatsapp_number TEXT DEFAULT '5511999999999',
  footer_text TEXT DEFAULT '© 2024 Loja Rafael',
  footer_company_name TEXT DEFAULT 'Loja Rafael',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar personalização
CREATE TABLE store_customization (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER DEFAULT 1,
  primary_color TEXT DEFAULT '#e11d48',
  secondary_color TEXT DEFAULT '#f1f5f9',
  accent_color TEXT DEFAULT '#0f172a',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  button_color TEXT DEFAULT '#e11d48',
  button_text_color TEXT DEFAULT '#ffffff',
  site_background_color TEXT DEFAULT '#f8fafc',
  card_background_color TEXT DEFAULT '#ffffff',
  card_border_color TEXT DEFAULT '#e2e8f0',
  header_color TEXT DEFAULT '#ffffff',
  footer_color TEXT DEFAULT '#ffffff',
  cart_color TEXT DEFAULT '#ffffff',
  menu_color TEXT DEFAULT '#f8fafc',
  logo_url TEXT,
  logo_size TEXT DEFAULT 'medium',
  show_logo BOOLEAN DEFAULT true,
  show_store_name BOOLEAN DEFAULT true,
  theme_style TEXT DEFAULT 'modern',
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar admin
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas abertas
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true);
CREATE POLICY "allow_all_products" ON products FOR ALL USING (true);
CREATE POLICY "allow_all_settings" ON store_settings FOR ALL USING (true);
CREATE POLICY "allow_all_customization" ON store_customization FOR ALL USING (true);
CREATE POLICY "allow_all_admin" ON admin_users FOR ALL USING (true);

-- Dados básicos
INSERT INTO store_settings (id, store_name, whatsapp_number) VALUES (1, 'Loja Rafael', '5511999999999');
INSERT INTO store_customization (id, store_id) VALUES (1, 1);
INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'bella123');
INSERT INTO categories (name, display_order) VALUES ('Blusas', 1), ('Vestidos', 2), ('Perfumes', 3);
INSERT INTO products (name, price, image, category, stock) VALUES 
('Blusa Teste', 89.90, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500', 'Blusas', 10);

-- Verificar
SELECT 'SUCCESS - Tabelas criadas!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('categories', 'products', 'store_settings', 'store_customization', 'admin_users');
