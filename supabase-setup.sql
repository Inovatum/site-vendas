-- Script SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar tabela de configurações da loja
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_name VARCHAR(255) DEFAULT 'Minha Loja',
  whatsapp_number VARCHAR(20) DEFAULT '5511999999999',
  monthly_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO store_settings (store_name, whatsapp_number, monthly_sales)
VALUES ('Minha Loja', '5511999999999', 0)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  sizes TEXT[], -- Array de strings para tamanhos
  colors TEXT[], -- Array de strings para cores
  stock INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos
CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON products
FOR ALL USING (true);

-- Políticas para configurações da loja
CREATE POLICY "Enable read access for all users on settings" ON store_settings
FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users on settings" ON store_settings
FOR ALL USING (true);

-- Inserir alguns produtos de exemplo (opcional)
INSERT INTO products (name, price, image, category, sizes, colors, stock, status) VALUES
('Blusa Feminina Verde', 79.90, 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=300&h=400&fit=crop', 'Blusas', ARRAY['P', 'M', 'G'], ARRAY['Verde', 'Azul', 'Rosa'], 15, 'active'),
('Perfume Floral Dreams', 89.90, 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=300&h=400&fit=crop', 'Perfumes', NULL, NULL, 8, 'active'),
('Camisa Listrada Masculina', 59.90, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=400&fit=crop', 'Camisas', ARRAY['P', 'M', 'G', 'GG'], NULL, 23, 'active'),
('Perfume Luxury Gold', 129.90, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop', 'Perfumes', NULL, NULL, 5, 'active'),
('Vestido Floral Verão', 149.90, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop', 'Vestidos', ARRAY['P', 'M', 'G'], NULL, 12, 'active'),
('Calça Jeans Premium', 199.90, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop', 'Calças', ARRAY['36', '38', '40', '42'], NULL, 7, 'active');
