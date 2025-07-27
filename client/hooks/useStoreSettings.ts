import { useState, useEffect } from 'react'
import { supabase, StoreSettings, StoreSettingsUpdate } from '@/lib/supabase'

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar configurações da loja
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single()

      if (error) {
        // Se a tabela não existe ou não há dados, criar configurações padrão
        if (error.code === 'PGRST116' || error.code === 'PGRST116') {
          console.log('Creating default store settings...')
          await createDefaultSettings()
          return
        }
        throw error
      }

      setSettings(data)
    } catch (err) {
      // Não usar fallback - dependemos do banco
      console.error('Erro ao conectar com store_settings:', err)
      let errorMessage = 'Erro ao carregar configurações';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }

      setError(errorMessage)
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }

  // Criar configurações padrão
  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        store_name: 'Minha Loja',
        whatsapp_number: '5511999999999',
        monthly_sales: 0
      }

      const { data, error } = await supabase
        .from('store_settings')
        .insert([defaultSettings])
        .select()
        .single()

      if (error) throw error

      setSettings(data)
    } catch (err) {
      console.error('Erro ao criar configurações padrão:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar configurações'
      setError(errorMessage)
    }
  }

  // Atualizar configurações
  const updateSettings = async (update: StoreSettingsUpdate): Promise<boolean> => {
    try {
      if (!settings) {
        console.warn('No settings available to update')
        return false
      }

      const { error } = await supabase
        .from('store_settings')
        .update(update)
        .eq('id', settings.id)

      if (error) {
        console.error('Erro ao atualizar configurações:', error.message || error.code || error)
        throw new Error(`Erro ao atualizar configurações: ${error.message || error.code || 'Erro desconhecido'}`)
      }

      await fetchSettings() // Recarregar configurações
      return true
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações'
      setError(errorMessage)
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    clearError: () => setError(null)
  }
}
