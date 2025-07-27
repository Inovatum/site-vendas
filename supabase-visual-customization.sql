-- Script SQL para adicionar campos de customização visual
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas de customização visual à tabela store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#e11d48',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#f1f5f9',
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS button_color VARCHAR(7) DEFAULT '#e11d48',
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_store_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS theme_style VARCHAR(20) DEFAULT 'modern' CHECK (theme_style IN ('modern', 'classic', 'minimal'));

-- Atualizar configurações existentes com valores padrão
UPDATE store_settings 
SET 
  primary_color = COALESCE(primary_color, '#e11d48'),
  secondary_color = COALESCE(secondary_color, '#f1f5f9'),
  accent_color = COALESCE(accent_color, '#0f172a'),
  background_color = COALESCE(background_color, '#ffffff'),
  text_color = COALESCE(text_color, '#1f2937'),
  button_color = COALESCE(button_color, '#e11d48'),
  button_text_color = COALESCE(button_text_color, '#ffffff'),
  show_logo = COALESCE(show_logo, true),
  show_store_name = COALESCE(show_store_name, true),
  theme_style = COALESCE(theme_style, 'modern')
WHERE id = 1;

-- Garantir que existe pelo menos uma configuração
INSERT INTO store_settings (
  store_name, 
  whatsapp_number, 
  monthly_sales,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  button_color,
  button_text_color,
  show_logo,
  show_store_name,
  theme_style
) 
SELECT 
  'Minha Loja', 
  '5511999999999', 
  0,
  '#e11d48',
  '#f1f5f9', 
  '#0f172a',
  '#ffffff',
  '#1f2937',
  '#e11d48',
  '#ffffff',
  true,
  true,
  'modern'
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);
