import { useState, useEffect } from 'react'
import { supabase, debugSupabaseError } from '@/lib/supabase'

export interface StoreCustomization {
  id: number
  store_id: number
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  button_color: string
  button_text_color: string
  site_background_color: string
  card_background_color: string
  card_border_color: string
  header_color: string
  footer_color: string
  cart_color: string
  menu_color: string
  logo_url?: string | null
  logo_size: 'small' | 'medium' | 'large'
  show_logo: boolean
  show_store_name: boolean
  theme_style: 'modern' | 'classic' | 'minimal'
  custom_css?: string | null
  created_at?: string
  updated_at?: string
}

export interface StoreCustomizationUpdate {
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  text_color?: string
  button_color?: string
  button_text_color?: string
  site_background_color?: string
  card_background_color?: string
  card_border_color?: string
  header_color?: string
  footer_color?: string
  cart_color?: string
  menu_color?: string
  logo_url?: string | null
  logo_size?: 'small' | 'medium' | 'large'
  show_logo?: boolean
  show_store_name?: boolean
  theme_style?: 'modern' | 'classic' | 'minimal'
  custom_css?: string | null
}

export function useStoreCustomization() {
  const [customization, setCustomization] = useState<StoreCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar configurações de customização
  const fetchCustomization = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando customização no banco...')
      
      const { data, error } = await supabase
        .from('store_customization')
        .select('*')
        .eq('store_id', 1)
        .single()

      if (error) {
        debugSupabaseError(error, 'fetchCustomization')
        console.log('⚠️ Erro ao buscar customização:', error.message || error.code || error)
        // Se não existe, criar padrão
        await createDefaultCustomization()
        return
      }
      
      console.log('✅ Customização encontrada:', data)
      console.log('🎨 Cores carregadas:', {
        button_color: data.button_color,
        primary_color: data.primary_color,
        site_background_color: data.site_background_color
      })
      setCustomization(data)
    } catch (err) {
      console.error('❌ Erro geral:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar customização')
    } finally {
      setLoading(false)
    }
  }

  // Criar customização padrão
  const createDefaultCustomization = async () => {
    try {
      console.log('📝 Criando customização padrão...')
      
      const defaultCustomization = {
        store_id: 1,
        primary_color: '#e11d48',
        secondary_color: '#f1f5f9',
        accent_color: '#0f172a',
        background_color: '#ffffff',
        text_color: '#1f2937',
        button_color: '#e11d48',
        button_text_color: '#ffffff',
        site_background_color: '#f8fafc',
        card_background_color: '#ffffff',
        card_border_color: '#e2e8f0',
        header_color: '#ffffff',
        footer_color: '#ffffff',
        cart_color: '#ffffff',
        menu_color: '#f8fafc',
        logo_size: 'medium' as const,
        show_logo: true,
        show_store_name: true,
        theme_style: 'modern' as const
      }

      const { data, error } = await supabase
        .from('store_customization')
        .insert([defaultCustomization])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar customização padrão:', error.message || error.code || error)
        throw new Error(`Erro ao criar customização padrão: ${error.message || error.code || 'Erro desconhecido'}`)
      }
      
      console.log('✅ Customização padrão criada:', data)
      setCustomization(data)
    } catch (err) {
      console.error('❌ Erro ao criar customização padrão:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar customização')
    }
  }

  // Atualizar customização
  const updateCustomization = async (update: StoreCustomizationUpdate): Promise<boolean> => {
    try {
      console.log('💾 Salvando customização...', update)
      
      if (!customization) {
        console.error('❌ Nenhuma customização carregada')
        return false
      }

      const { data, error } = await supabase
        .from('store_customization')
        .update(update)
        .eq('id', customization.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar customização:', error.message || error.code || error)
        throw new Error(`Erro ao atualizar customização: ${error.message || error.code || 'Erro desconhecido'}`)
      }
      
      console.log('✅ Customização atualizada com sucesso:', data)
      setCustomization(data)
      return true
    } catch (err) {
      console.error('❌ Erro ao atualizar customização:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar customização')
      return false
    }
  }

  useEffect(() => {
    fetchCustomization()
  }, [])

  return {
    customization,
    loading,
    error,
    fetchCustomization,
    updateCustomization,
    clearError: () => setError(null)
  }
}
