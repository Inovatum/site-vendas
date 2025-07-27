-- ============================================================================
-- LOJA DE ROUPAS - SCHEMA COMPLETO V6 - INSTALAÇÃO LIMPA
-- ============================================================================
-- EXECUTA TUDO DE UMA VEZ - DELETA E RECRIA COMPLETAMENTE
-- Data: Janeiro 2024
-- Versão: 6.0 - Fresh Install
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPEZA TOTAL (REMOVE TUDO)
-- ============================================================================

-- Remover políticas RLS
DROP POLICY IF EXISTS "Allow all operations" ON categories;
DROP POLICY IF EXISTS "Allow all operations" ON products;
DROP POLICY IF EXISTS "Allow all operations" ON store_settings;
DROP POLICY IF EXISTS "Allow all operations" ON store_customization;
DROP POLICY IF EXISTS "Allow all operations" ON admin_users;

-- Remover funções
DROP FUNCTION IF EXISTS validate_admin_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS change_admin_password(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remover todas as tabelas
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS store_customization CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================================
-- PARTE 2: CRIAÇÃO DAS TABELAS
-- ============================================================================

-- TABELA 1: CATEGORIAS DOS PRODUTOS
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 2: PRODUTOS (COM SUPORTE A 2 IMAGENS)
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  image_2 TEXT NULL, -- Segunda imagem opcional
  category TEXT NOT NULL,
  sizes TEXT[] DEFAULT NULL, -- Array: ["P", "M", "G", "GG", "XG"]
  colors TEXT[] DEFAULT NULL, -- Array: ["Branco", "Preto", "Azul"]
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 3: CONFIGURAÇÕES GERAIS DA LOJA
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

-- TABELA 4: PERSONALIZAÇÃO VISUAL COMPLETA
CREATE TABLE store_customization (
  id BIGSERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL DEFAULT 1,
  
  -- CORES PRINCIPAIS
  primary_color TEXT NOT NULL DEFAULT '#e11d48',
  secondary_color TEXT NOT NULL DEFAULT '#f1f5f9',
  accent_color TEXT NOT NULL DEFAULT '#0f172a',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  
  -- CORES DOS BOTÕES
  button_color TEXT NOT NULL DEFAULT '#e11d48',
  button_text_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- CORES DO SITE E CARDS
  site_background_color TEXT NOT NULL DEFAULT '#f8fafc',
  card_background_color TEXT NOT NULL DEFAULT '#ffffff',
  card_border_color TEXT NOT NULL DEFAULT '#e2e8f0',
  
  -- CORES ESPECÍFICAS
  header_color TEXT NOT NULL DEFAULT '#ffffff',
  footer_color TEXT NOT NULL DEFAULT '#ffffff',
  cart_color TEXT NOT NULL DEFAULT '#ffffff',
  menu_color TEXT NOT NULL DEFAULT '#f8fafc',
  
  -- CONFIGURAÇÕES DO LOGO
  logo_url TEXT NULL,
  logo_size TEXT NOT NULL DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_store_name BOOLEAN NOT NULL DEFAULT true,
  
  -- TEMA E ESTILO
  theme_style TEXT NOT NULL DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal')),
  custom_css TEXT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 5: USUÁRIOS ADMINISTRATIVOS
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
-- PARTE 3: FUNÇÕES E TRIGGERS
-- ============================================================================

-- FUNÇÃO: ATUALIZAR TIMESTAMP AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA TODAS AS TABELAS
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
-- PARTE 4: FUNÇÕES DE AUTENTICAÇÃO
-- ============================================================================

-- FUNÇÃO: VALIDAR LOGIN DO ADMINISTRADOR
CREATE OR REPLACE FUNCTION validate_admin_login(
    input_password TEXT,
    input_username TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    user_active BOOLEAN;
BEGIN
    -- Buscar dados do usuário
    SELECT password_hash, is_active 
    INTO stored_hash, user_active
    FROM admin_users 
    WHERE username = p_username;
    
    -- Verificar se usuário existe e está ativo
    IF stored_hash IS NULL OR NOT user_active THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar senha (versão simples - em produção usar bcrypt)
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

-- FUNÇÃO: ALTERAR SENHA DO ADMINISTRADOR
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
    
    -- Atualizar senha
    UPDATE admin_users 
    SET password_hash = p_new_password,
        updated_at = NOW()
    WHERE username = p_username;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- ============================================================================

-- Habilitar Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (DESENVOLVIMENTO - EM PRODUÇÃO RESTRINGIR)
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON store_customization FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);

-- ============================================================================
-- PARTE 6: DADOS INICIAIS (SEEDS)
-- ============================================================================

-- CONFIGURAÇÕES BÁSICAS DA LOJA
INSERT INTO store_settings (
    id, store_name, whatsapp_number, footer_text, footer_company_name
) VALUES (
    1, 'Loja Rafael', '5511999999999', 
    '© 2024 Loja Rafael. Todos os direitos reservados.', 
    'Loja Rafael'
);

-- PERSONALIZAÇÃO VISUAL PADRÃO
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

-- USUÁRIO ADMINISTRADOR PADRÃO
INSERT INTO admin_users (username, password_hash, is_active) VALUES 
('admin', 'bella123', true);

-- CATEGORIAS PADRÃO
INSERT INTO categories (name, display_order, is_active) VALUES
('Blusas', 1, true),
('Camisas', 2, true),
('Vestidos', 3, true),
('Calças', 4, true),
('Perfumes', 5, true),
('Acessórios', 6, true),
('Sapatos', 7, true);

-- PRODUTOS DE EXEMPLO COM 2 IMAGENS
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
-- PARTE 7: VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se tudo foi criado corretamente
DO $$
DECLARE
    table_count INTEGER;
    settings_count INTEGER;
    customization_count INTEGER;
    admin_count INTEGER;
    categories_count INTEGER;
    products_count INTEGER;
BEGIN
    -- Contar tabelas criadas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'products', 'store_settings', 'store_customization', 'admin_users');
    
    -- Contar registros inseridos
    SELECT COUNT(*) INTO settings_count FROM store_settings;
    SELECT COUNT(*) INTO customization_count FROM store_customization;
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    SELECT COUNT(*) INTO categories_count FROM categories;
    SELECT COUNT(*) INTO products_count FROM products;
    
    -- Relatório final
    RAISE NOTICE '=== INSTALAÇÃO CONCLUÍDA COM SUCESSO ===';
    RAISE NOTICE 'Tabelas criadas: %', table_count;
    RAISE NOTICE 'Configurações: %', settings_count;
    RAISE NOTICE 'Personalizações: %', customization_count;
    RAISE NOTICE 'Usuários admin: %', admin_count;
    RAISE NOTICE 'Categorias: %', categories_count;
    RAISE NOTICE 'Produtos: %', products_count;
    RAISE NOTICE '======================================';
    
    IF table_count = 5 AND settings_count > 0 AND customization_count > 0 THEN
        RAISE NOTICE '✅ SUCESSO: Banco de dados configurado corretamente!';
        RAISE NOTICE '🔐 Login: admin / bella123';
        RAISE NOTICE '🏪 Loja: Loja Rafael';
        RAISE NOTICE '📱 WhatsApp: 5511999999999';
    ELSE
        RAISE NOTICE '❌ ERRO: Algum problema na instalação!';
    END IF;
END $$;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON DATABASE postgres IS 'Loja de Roupas - Sistema Completo V6';
COMMENT ON TABLE categories IS 'Categorias de produtos (Blusas, Vestidos, etc)';
COMMENT ON TABLE products IS 'Produtos com suporte a 2 imagens';
COMMENT ON TABLE store_settings IS 'Configurações gerais da loja';
COMMENT ON TABLE store_customization IS 'Personalização visual completa';
COMMENT ON TABLE admin_users IS 'Usu��rios administrativos';

-- ============================================================================
-- SCRIPT V6 CONCLUÍDO - EXECUTE ESTE ARQUIVO COMPLETO UMA ÚNICA VEZ
-- ============================================================================
