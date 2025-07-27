import { useState, useEffect } from 'react'
import { supabase, debugSupabaseError } from '@/lib/supabase'

export interface Category {
  id: number
  name: string
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CategoryInsert {
  name: string
  display_order?: number
  is_active?: boolean
}

export interface CategoryUpdate {
  id: number
  name?: string
  display_order?: number
  is_active?: boolean
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Buscar todas as categorias
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando categorias...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      console.log('📊 Resposta das categorias:', { data, error })

      if (error) {
        debugSupabaseError(error, 'fetchCategories')
        console.error('❌ Erro do Supabase:', error.message || error.code || error)
        throw new Error(`Erro ao buscar categorias: ${error.message || error.code || 'Erro desconhecido'}`)
      }

      console.log('✅ Categorias carregadas:', data?.length || 0)
      setCategories(data || [])
      setIsConnected(true)

    } catch (err) {
      console.error('❌ Erro ao conectar com categorias:', err)
      setIsConnected(false)
      setCategories([])

      let errorMessage = 'Erro ao conectar com o banco de dados';

      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Sem conexão com banco de dados';
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }

      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  // Adicionar categoria
  const addCategory = async (category: CategoryInsert): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível adicionar categoria: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          display_order: category.display_order || 999,
          is_active: category.is_active ?? true
        }])

      if (error) {
        console.error('❌ Erro Supabase ao adicionar categoria:', error)
        debugSupabaseError(error, 'addCategory')
        throw error
      }

      console.log('✅ Categoria inserida no banco com sucesso')
      await fetchCategories() // Recarregar lista
      return true
    } catch (err) {
      console.error('❌ Erro ao adicionar categoria:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar categoria'
      setError(errorMessage)
      return false
    }
  }

  // Atualizar categoria
  const updateCategory = async (update: CategoryUpdate): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível atualizar categoria: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('categories')
        .update(update)
        .eq('id', update.id)

      if (error) throw error

      await fetchCategories() // Recarregar lista
      return true
    } catch (err) {
      console.error('Error updating category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
      setError(errorMessage)
      return false
    }
  }

  // Deletar categoria
  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível deletar categoria: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchCategories() // Recarregar lista
      return true
    } catch (err) {
      console.error('Error deleting category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar categoria'
      setError(errorMessage)
      return false
    }
  }

  // Alternar status ativo/inativo
  const toggleCategoryStatus = async (id: number): Promise<boolean> => {
    try {
      const category = categories.find(c => c.id === id)
      if (!category) throw new Error('Categoria não encontrada')

      return await updateCategory({ id, is_active: !category.is_active })
    } catch (err) {
      console.error('Error toggling category status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status'
      setError(errorMessage)
      return false
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    activeCategories: categories.filter(c => c.is_active),
    loading,
    error,
    isConnected,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    clearError: () => setError(null)
  }
}
