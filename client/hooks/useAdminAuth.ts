"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

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

  // Fazer login com debug completo
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔐 Iniciando login para:", credentials.username)

      // Validação básica
      if (!credentials.username.trim() || !credentials.password.trim()) {
        setError("Usuário e senha são obrigatórios")
        return false
      }

      // MÉTODO 1: Tentar função do Supabase
      console.log("📡 Tentando função validate_admin_login...")

      try {
        const { data, error } = await supabase.rpc("validate_admin_login", {
          input_username: credentials.username,
          input_password: credentials.password,
        })

        console.log("📡 Resposta da função:", { data, error })

        if (error) {
          console.error("❌ Erro na função:", error)
          throw new Error(`Erro na função: ${error.message}`)
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const adminUser = data[0] as AdminUser
          console.log("✅ Login válido via função:", adminUser)

          setUser(adminUser)
          localStorage.setItem("admin_authenticated", "true")
          localStorage.setItem("admin_user", JSON.stringify(adminUser))
          return true
        } else {
          console.log("❌ Função retornou array vazio")
        }
      } catch (funcError) {
        console.error("❌ Erro ao chamar função:", funcError)
      }

      // MÉTODO 2: Query direta na tabela
      console.log("📊 Tentando query direta na tabela...")

      try {
        const { data: userData, error: queryError } = await supabase
          .from("admin_users")
          .select("id, username, is_active")
          .eq("username", credentials.username)
          .eq("password_hash", credentials.password)
          .eq("is_active", true)
          .single()

        console.log("📊 Resposta da query:", { userData, queryError })

        if (queryError) {
          console.error("❌ Erro na query:", queryError)
        } else if (userData) {
          const adminUser: AdminUser = {
            id: userData.id,
            username: userData.username,
            email: `${userData.username}@minhaloja.com`,
            full_name: "Administrador",
            is_active: userData.is_active,
          }

          console.log("✅ Login válido via query:", adminUser)

          setUser(adminUser)
          localStorage.setItem("admin_authenticated", "true")
          localStorage.setItem("admin_user", JSON.stringify(adminUser))
          return true
        }
      } catch (queryError) {
        console.error("❌ Erro na query direta:", queryError)
      }

      // MÉTODO 3: Fallback hardcoded
      console.log("🔄 Usando fallback hardcoded...")

      if (credentials.username === "admin" && credentials.password === "bella123") {
        const fallbackUser: AdminUser = {
          id: 1,
          username: "admin",
          email: "admin@minhaloja.com",
          full_name: "Administrador",
          is_active: true,
        }

        console.log("✅ Login válido via fallback:", fallbackUser)

        setUser(fallbackUser)
        localStorage.setItem("admin_authenticated", "true")
        localStorage.setItem("admin_user", JSON.stringify(fallbackUser))
        return true
      }

      // Se chegou até aqui, credenciais são inválidas
      console.log("❌ Todas as tentativas falharam")
      setError("Usuário ou senha incorretos")
      return false
    } catch (err) {
      console.error("❌ Erro geral no login:", err)
      setError("Erro interno do sistema")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Fazer logout
  const logout = () => {
    setUser(null)
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_user")
    console.log("👋 Logout realizado")
  }

  // Verificar se está autenticado
  const checkAuth = (): boolean => {
    try {
      const isAuth = localStorage.getItem("admin_authenticated")
      const userData = localStorage.getItem("admin_user")

      if (isAuth === "true" && userData) {
        const adminUser = JSON.parse(userData) as AdminUser
        setUser(adminUser)
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      return false
    }
  }

  // Trocar senha (simplificado)
  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    console.log("Função de trocar senha ainda não implementada")
    return false
  }

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
