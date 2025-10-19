"use client"

import { useState, useCallback } from "react" // Importar useCallback
import { supabase, debugSupabaseError, formatError } from "@/lib/supabase" // formatError também vem de supabase.ts agora

export interface AdminUser {
  id: number
  username: string
  email: string
  full_name: string
  is_active: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fallback para autenticação simples quando banco não está configurado
  const loginFallback = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    console.log("🔄 Usando autenticação simples como fallback")
    // Usar credenciais hardcoded como fallback
    if (credentials.username === "admin" && credentials.password === "bella123") {
      const fallbackUser: AdminUser = {
        id: 1,
        username: "admin",
        email: "admin@minhaloja.com",
        full_name: "Administrador",
        is_active: true,
      }
      setUser(fallbackUser)
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_user", JSON.stringify(fallbackUser))
      console.log("✅ Login fallback válido")
      return true
    } else {
      console.log("❌ Credenciais fallback inválidas")
      setError("Usuário ou senha incorretos (usando autenticação simples)")
      return false
    }
  }, []) // Dependência vazia, pois não depende de nenhum estado/prop externo

  // Fazer login
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        // Validação básica
        if (!credentials.username.trim() || !credentials.password.trim()) {
          setError("Usuário e senha são obrigatórios")
          return false
        }

        console.log("🔐 Tentando login admin:", credentials.username)

        // Chamar função do banco para validar login
        const { data, error } = await supabase.rpc("validate_admin_login", {
          input_username: credentials.username,
          input_password: credentials.password,
        })

        if (error) {
          // Detect common RPC-missing or signature errors and use fallback without noisy debug logs
          const errorMsg = formatError(error)
          const errCode = (error as any)?.code
          const isMissingFn = errCode === "PGRST202" || /could not find the function/i.test(errorMsg) || /does not exist/i.test(errorMsg) || /validate_admin_login/i.test(errorMsg)

          if (isMissingFn) {
            console.warn("⚠️ Função SQL validate_admin_login ausente ou incompatível, usando autenticação simples como fallback")
            return await loginFallback(credentials)
          }

          // For other errors keep full debug logs
          debugSupabaseError(error, "validate_admin_login")
          console.error("❌ Erro na validação:", errorMsg)
          throw new Error(errorMsg)
        }

        // A função agora retorna um array de objetos ou array vazio
        if (data && Array.isArray(data) && data.length > 0) {
          const adminUser = data[0] as AdminUser
          console.log("✅ Login válido:", adminUser.username)

          setUser(adminUser)

          // Salvar no localStorage para manter sessão
          localStorage.setItem("admin_authenticated", "true")
          localStorage.setItem("admin_user", JSON.stringify(adminUser))

          return true
        } else {
          console.log("❌ Credenciais inválidas - função retornou array vazio")
          setError("Usuário ou senha incorretos")
          return false
        }
      } catch (err) {
        console.error("❌ Erro no login:", formatError(err))
        const errorMessage = formatError(err) || "Erro ao fazer login"

        // Se houver erro, tentar fallback
        console.warn("⚠️ Erro na autenticação do banco, tentando fallback...")
        return await loginFallback(credentials)
      } finally {
        setLoading(false)
      }
    },
    [loginFallback],
  ) // login depende de loginFallback

  // Fazer logout
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_user")
    console.log("👋 Logout realizado")
  }, []) // Dependência vazia

  // Verificar se está autenticado (restaurar sessão)
  const checkAuth = useCallback((): boolean => {
    try {
      const isAuth = localStorage.getItem("admin_authenticated")
      const userData = localStorage.getItem("admin_user")

      if (isAuth === "true" && userData) {
        try {
          const adminUser = JSON.parse(userData) as AdminUser
          // Apenas define o usuário se for diferente para evitar re-renders desnecessários
          if (!user || user.id !== adminUser.id || user.username !== adminUser.username) {
            setUser(adminUser)
          }
          return true
        } catch (parseError) {
          console.error("Erro ao fazer parse dos dados do usuário:", parseError)
          // Limpar dados corrompidos
          localStorage.removeItem("admin_authenticated")
          localStorage.removeItem("admin_user")
          return false
        }
      }
      // Se não autenticado ou dados ausentes, garante que o estado do usuário seja null
      if (user !== null) {
        setUser(null)
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar autenticação:", formatError(error))
      return false
    }
  }, [user]) // Dependência em 'user' para verificar se o estado precisa ser atualizado

  // Trocar senha
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<boolean> => {
      try {
        if (!user) {
          setError("Usuário não está logado")
          return false
        }

        setLoading(true)
        setError(null)

        const { data, error } = await supabase.rpc("change_admin_password", {
          p_username: user.username,
          p_old_password: oldPassword,
          p_new_password: newPassword,
        })

        if (error) {
          debugSupabaseError(error, "change_admin_password")
          console.error("❌ Erro ao trocar senha:", formatError(error))
          throw new Error(formatError(error))
        }

        if (data === true) {
          console.log("✅ Senha alterada com sucesso")
          return true
        } else {
          setError("Senha atual incorreta")
          return false
        }
      } catch (err) {
        console.error("❌ Erro ao trocar senha:", formatError(err))
        const errorMessage = formatError(err) || "Erro ao trocar senha"
        setError(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    [user],
  ) // Dependência em 'user'

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    changePassword,
    isAuthenticated: !!user,
    clearError: () => setError(null),
  }
}
