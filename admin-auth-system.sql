-- ============================================================================
-- SISTEMA DE AUTENTICAÇÃO ADMIN - TABELA E DADOS
-- ============================================================================

-- Criar tabela de usuários admin
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
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Trigger para admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_users (leitura e escrita públicas)
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
CREATE POLICY "Enable read access for all users" ON admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON admin_users;
CREATE POLICY "Enable insert for all users" ON admin_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON admin_users;
CREATE POLICY "Enable update for all users" ON admin_users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON admin_users;
CREATE POLICY "Enable delete for all users" ON admin_users FOR DELETE USING (true);

-- ============================================================================
-- DADOS PADRÃO
-- ============================================================================

-- Usuário admin padrão (senha: bella123)
-- IMPORTANTE: Trocar esta senha após o primeiro login!
INSERT INTO admin_users (username, password, email, full_name, is_active) 
VALUES (
  'admin', 
  'bella123', -- SENHA SIMPLES TEMPORÁRIA - TROCAR APÓS LOGIN!
  'admin@minhaloja.com', 
  'Administrador', 
  true
) 
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA AUTENTICAÇÃO
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
-- EXEMPLOS DE USO
-- ============================================================================

-- Validar login:
-- SELECT * FROM validate_admin_login('admin', 'bella123');

-- Trocar senha:
-- SELECT change_admin_password('admin', 'bella123', 'nova_senha_segura');

-- Verificar usuários:
-- SELECT username, email, full_name, is_active, last_login FROM admin_users;

-- ============================================================================
-- CONFIRMAÇÃO
-- ============================================================================
SELECT 'Sistema de autenticação admin criado com sucesso!' as status;
SELECT 'Usuário padrão: admin / Senha padrão: bella123' as credentials;
SELECT 'IMPORTANTE: Trocar senha após primeiro login!' as warning;

-- ============================================================================
-- NOTAS DE SEGURANÇA:
-- ============================================================================
-- ✅ Tabela admin_users criada
-- ✅ Usuário padrão: admin / bella123
-- ✅ Função de validação de login
-- ✅ Função de troca de senha
-- ✅ Last_login tracking
-- ✅ RLS policies configuradas
-- ⚠️  IMPORTANTE: Implementar hash de senha (bcrypt) no frontend
-- ⚠️  IMPORTANTE: Trocar senha padrão após primeiro acesso
-- ⚠️  IMPORTANTE: Adicionar rate limiting no frontend para login
