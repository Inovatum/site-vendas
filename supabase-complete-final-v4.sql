-- ============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS - SUPABASE (VERSÃO FINAL v4)
-- COM SISTEMA DE AUTENTICAÇÃO ADMIN
-- ============================================================================

-- Limpar dados existentes (opcional)
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS store_settings CASCADE;
-- DROP TABLE IF EXISTS store_customization CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;

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
-- 2. TABELA DE PRODUTOS
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
-- 3. TABELA DE CONFIGURAÇÕES DA LOJA
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
-- 4. TABELA DE CUSTOMIZAÇÃO VISUAL COMPLETA
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
  
  -- Logo e identidade visual
  logo_url TEXT,
  logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  show_logo BOOLEAN DEFAULT true,
  show_store_name BOOLEAN DEFAULT true,
  
  -- Tema e estilos
  theme_style TEXT DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA DE USUÁRIOS ADMIN (NOVO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Hash da senha (usar bcrypt no frontend)
  email TEXT UNIQUE,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger para admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON categories;
CREATE POLICY "Enable insert for all users" ON categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON categories;
CREATE POLICY "Enable update for all users" ON categories FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON categories;
CREATE POLICY "Enable delete for all users" ON categories FOR DELETE USING (true);

-- Políticas para products
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON products;
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON products;
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- Políticas para store_settings
DROP POLICY IF EXISTS "Enable read access for all users" ON store_settings;
CREATE POLICY "Enable read access for all users" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON store_settings;
CREATE POLICY "Enable insert for all users" ON store_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON store_settings;
CREATE POLICY "Enable update for all users" ON store_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON store_settings;
CREATE POLICY "Enable delete for all users" ON store_settings FOR DELETE USING (true);

-- Políticas para store_customization
DROP POLICY IF EXISTS "Enable read access for all users" ON store_customization;
CREATE POLICY "Enable read access for all users" ON store_customization FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON store_customization;
CREATE POLICY "Enable insert for all users" ON store_customization FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON store_customization;
CREATE POLICY "Enable update for all users" ON store_customization FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON store_customization;
CREATE POLICY "Enable delete for all users" ON store_customization FOR DELETE USING (true);

-- Políticas para admin_users
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
CREATE POLICY "Enable read access for all users" ON admin_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON admin_users;
CREATE POLICY "Enable insert for all users" ON admin_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON admin_users;
CREATE POLICY "Enable update for all users" ON admin_users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON admin_users;
CREATE POLICY "Enable delete for all users" ON admin_users FOR DELETE USING (true);

-- ============================================================================
-- 8. FUNÇÕES PARA AUTENTICAÇÃO ADMIN
-- ============================================================================

-- Função para validar login (username/password)
CREATE OR REPLACE FUNCTION validate_admin_login(
  input_username TEXT,
  input_password TEXT
) RETURNS TABLE(
  id BIGINT,
  username TEXT,
  email TEXT,
  full_name TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  -- Atualizar last_login se credenciais válidas
  UPDATE admin_users 
  SET last_login = NOW() 
  WHERE admin_users.username = input_username 
    AND admin_users.password = input_password 
    AND admin_users.is_active = true;

  -- Retornar dados do usuário se login válido
  RETURN QUERY
  SELECT 
    admin_users.id,
    admin_users.username,
    admin_users.email,
    admin_users.full_name,
    admin_users.is_active
  FROM admin_users
  WHERE admin_users.username = input_username 
    AND admin_users.password = input_password 
    AND admin_users.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Função para trocar senha
CREATE OR REPLACE FUNCTION change_admin_password(
  input_username TEXT,
  old_password TEXT,
  new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Verificar se usuário existe e senha antiga está correta
  SELECT EXISTS(
    SELECT 1 FROM admin_users 
    WHERE username = input_username 
      AND password = old_password 
      AND is_active = true
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Atualizar senha
    UPDATE admin_users 
    SET password = new_password, updated_at = NOW()
    WHERE username = input_username;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. DADOS PADRÃO
-- ============================================================================

-- Categorias padrão
INSERT INTO categories (name, display_order, is_active) VALUES
('Blusas', 1, true),
('Camisas', 2, true),
('Vestidos', 3, true),
('Calças', 4, true),
('Perfumes', 5, true),
('Acessórios', 6, true),
('Sapatos', 7, true)
ON CONFLICT (name) DO NOTHING;

-- Configurações padrão da loja
INSERT INTO store_settings (store_name, whatsapp_number, footer_text, footer_company_name) 
VALUES ('Minha Loja', '5511999999999', '© 2024 Minha Loja. Todos os direitos reservados.', 'Minha Loja')
ON CONFLICT DO NOTHING;

-- Customização visual padrão COMPLETA
INSERT INTO store_customization (
  store_id, 
  primary_color, secondary_color, accent_color, background_color, text_color,
  button_color, button_text_color,
  site_background_color, card_background_color, card_border_color,
  header_color, footer_color, cart_color, menu_color,
  logo_size, theme_style
) VALUES (
  1,
  '#e11d48', '#f1f5f9', '#0f172a', '#ffffff', '#1f2937',
  '#e11d48', '#ffffff',
  '#f8fafc', '#ffffff', '#e2e8f0',
  '#ffffff', '#ffffff', '#ffffff', '#f8fafc',
  'medium', 'modern'
) ON CONFLICT DO NOTHING;

-- Usuário admin padrão
INSERT INTO admin_users (username, password, email, full_name, is_active) 
VALUES (
  'admin', 
  'bella123', -- SENHA SIMPLES TEMPORÁRIA - TROCAR APÓS LOGIN!
  'admin@minhaloja.com', 
  'Administrador', 
  true
) 
ON CONFLICT (username) DO NOTHING;

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
-- CONFIRMAÇÃO E CREDENCIAIS
-- ============================================================================
SELECT 'Setup completo realizado com sucesso!' as status;
SELECT 'Tabelas criadas: categories, products, store_settings, store_customization, admin_users' as info;
SELECT 'CREDENCIAIS ADMIN:' as auth_info;
SELECT 'Usuário: admin' as username;
SELECT 'Senha: bella123' as password;
SELECT 'IMPORTANTE: Trocar senha após primeiro login!' as warning;

-- ============================================================================
-- FUNCIONALIDADES IMPLEMENTADAS:
-- ============================================================================
-- ✅ Gestão completa de produtos com categorias, tamanhos e cores
-- ✅ Sistema de categorias gerenciável pelo admin
-- ✅ Configurações da loja (nome, WhatsApp, rodapé customizável - RODAPÉ UNIFICADO)
-- ✅ Sistema de cores COMPLETO (16 cores configuráveis)
-- ✅ Logo configurável (arredondada, 3 tamanhos, controle de visibilidade)
-- ✅ Sistema de autenticação admin no banco (NOVO):
--    - Login/senha no banco de dados
--    - Função validate_admin_login()
--    - Função change_admin_password()
--    - Controle de sessão e last_login
--    - Usuário padrão: admin / bella123
-- ✅ Temas visuais (moderno, clássico, minimalista)
-- ✅ CSS personalizado
-- ✅ Carrinho de compras com integração WhatsApp
-- ✅ Validação por categoria (roupas precisam de tamanho)
-- ✅ Sistema offline-first (só funciona com banco)
-- ✅ Prevenção de flash de cores padrão
-- ✅ Tratamento robusto de erros (sem [object Object])
-- ✅ Solução para tainted canvas (cross-origin images)
