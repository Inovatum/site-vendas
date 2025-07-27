-- ============================================================================
-- VERIFICAÇÃO COMPLETA DO BANCO DE DADOS
-- ============================================================================
-- Execute para verificar se tudo está funcionando corretamente
-- ============================================================================

-- 1. Verificar se todas as tabelas existem
SELECT 'TABELAS EXISTENTES:' as status;
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'products', 'store_settings', 'store_customization', 'admin_users')
ORDER BY tablename;

-- 2. Contar registros em cada tabela
SELECT 'CONTAGEM DE REGISTROS:' as status;
SELECT 'categories' as tabela, COUNT(*) as total FROM categories
UNION ALL
SELECT 'products' as tabela, COUNT(*) as total FROM products
UNION ALL
SELECT 'store_settings' as tabela, COUNT(*) as total FROM store_settings
UNION ALL
SELECT 'store_customization' as tabela, COUNT(*) as total FROM store_customization
UNION ALL
SELECT 'admin_users' as tabela, COUNT(*) as total FROM admin_users;

-- 3. Verificar dados básicos
SELECT 'CONFIGURAÇÕES DA LOJA:' as status;
SELECT store_name, whatsapp_number FROM store_settings LIMIT 1;

SELECT 'CUSTOMIZAÇÃO:' as status;
SELECT button_color, primary_color, show_logo FROM store_customization LIMIT 1;

SELECT 'USUÁRIO ADMIN:' as status;
SELECT username, is_active FROM admin_users WHERE username = 'admin';

SELECT 'CATEGORIAS ATIVAS:' as status;
SELECT name, display_order FROM categories WHERE is_active = true ORDER BY display_order;

SELECT 'PRODUTOS ATIVOS:' as status;
SELECT name, price, category FROM products WHERE status = 'active' LIMIT 5;
