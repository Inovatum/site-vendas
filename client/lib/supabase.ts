import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config Check:')
console.log('   URL:', supabaseUrl)
console.log('   Key exists:', !!supabaseAnonKey)
console.log('   Environment:', import.meta.env.MODE)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurações do Supabase não encontradas!')
  console.log('💡 Verifique se o arquivo .env existe com:')
  console.log('   VITE_SUPABASE_URL=sua-url-aqui')
  console.log('   VITE_SUPABASE_ANON_KEY=sua-key-aqui')
  throw new Error('Configurações do Supabase não encontradas. Verifique as variáveis de ambiente.')
}

// Adicionar configurações de debugging
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

console.log('✅ Supabase client criado com sucesso')

// Função auxiliar para debug de erros do Supabase
export function debugSupabaseError(error: any, context: string = '') {
  console.group(`🔍 Debug Supabase Error ${context ? '- ' + context : ''}`);
  console.log('Error object:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Error message:', error?.message);
  console.log('Error code:', error?.code);
  console.log('Error details:', error?.details);
  console.log('Error hint:', error?.hint);
  console.log('Full error keys:', Object.keys(error || {}));
  console.groupEnd();
}

// Tipos para o banco de dados
export interface Product {
  id: number
  name: string
  price: number
  image: string
  image_2?: string | null  // Segunda imagem (verso/lateral)
  category: string
  sizes?: string[]
  colors?: string[]
  stock?: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface StoreSettings {
  id: number
  store_name: string
  whatsapp_number: string
  monthly_sales: number
  footer_text: string
  footer_company_name: string
  created_at?: string
  updated_at?: string
}

export interface ProductInsert {
  name: string
  price: number
  image: string
  image_2?: string | null
  category: string
  sizes?: string[]
  colors?: string[]
  stock?: number
  status?: 'active' | 'inactive'
}

export interface ProductUpdate {
  id: number
  name?: string
  price?: number
  image?: string
  image_2?: string | null
  category?: string
  sizes?: string[]
  colors?: string[]
  stock?: number
  status?: 'active' | 'inactive'
}

export interface StoreSettingsUpdate {
  store_name?: string
  whatsapp_number?: string
  monthly_sales?: number
  footer_text?: string
  footer_company_name?: string
}
