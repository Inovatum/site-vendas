import { useState, useEffect } from 'react'
import { supabase, Product, ProductInsert, ProductUpdate } from '@/lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Buscar todos os produtos
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Tentando buscar produtos...')
      console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('🔗 Supabase Key existe:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

      // Tentar conectar com Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 Resposta do Supabase:', { data, error })

      if (error) {
        console.error('❌ Erro do Supabase:', error.message || error.code || error)
        throw new Error(`Erro ao buscar produtos: ${error.message || error.code || 'Erro desconhecido'}`)
      }

      console.log('✅ Produtos carregados do Supabase:', data?.length || 0)
      setProducts(data || [])
      setIsConnected(true)

    } catch (err) {
      console.error('❌ Erro ao conectar com Supabase:', err)
      setIsConnected(false)
      setProducts([])

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

  // Adicionar produto
  const addProduct = async (product: ProductInsert): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível adicionar produto: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('products')
        .insert([product])

      if (error) throw error

      await fetchProducts() // Recarregar lista
      return true
    } catch (err) {
      console.error('Error adding product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto'
      setError(errorMessage)
      return false
    }
  }

  // Atualizar produto
  const updateProduct = async (update: ProductUpdate): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível atualizar produto: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('products')
        .update(update)
        .eq('id', update.id)

      if (error) throw error

      await fetchProducts() // Recarregar lista
      return true
    } catch (err) {
      console.error('Error updating product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto'
      setError(errorMessage)
      return false
    }
  }

  // Deletar produto
  const deleteProduct = async (id: number): Promise<boolean> => {
    try {
      if (!isConnected) {
        setError('Não é possível deletar produto: banco de dados offline')
        return false
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchProducts() // Recarregar lista
      return true
    } catch (err) {
      console.error('Error deleting product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar produto'
      setError(errorMessage)
      return false
    }
  }

  // Alternar status do produto
  const toggleProductStatus = async (id: number): Promise<boolean> => {
    try {
      console.log('Toggling status for product ID:', id)
      const product = products.find(p => p.id === id)
      console.log('Found product:', product?.name, 'current status:', product?.status)

      if (!product) throw new Error('Produto não encontrado')

      const newStatus = product.status === 'active' ? 'inactive' : 'active'
      console.log('New status will be:', newStatus)

      return await updateProduct({ id, status: newStatus })
    } catch (err) {
      console.error('Error toggling product status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status'
      setError(errorMessage)
      return false
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    isConnected,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    clearError: () => setError(null)
  }
}
