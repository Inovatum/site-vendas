"use client"

import "./global.css"
import { Toaster } from "@/components/ui/toaster"
import { createRoot } from "react-dom/client"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Index from "./pages/Index"
import Admin from "./pages/Admin"
import AdminLogin from "./pages/AdminLogin"
import NotFound from "./pages/NotFound"
import { useStoreSettings } from "@/hooks/useStoreSettings" // Importar o hook de configurações da loja
import { useEffect } from "react" // Importar useEffect

const queryClient = new QueryClient()

// Componente que irá conter a lógica de carregamento das configurações e as rotas
const AppContent = () => {
  const { settings, loading: settingsLoading, error: settingsError } = useStoreSettings()

  // Efeito para atualizar o título da aba do navegador e o favicon globalmente
  useEffect(() => {
    if (settings) {
      console.log("✨ AppContent: Atualizando título e favicon com settings:", settings)
      document.title = settings.browser_tab_title || "Loja Rafael - Admin" // Fallback padrão

      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.getElementsByTagName("head")[0].appendChild(link)
      }
      link.href = settings.favicon_url || "/placeholder.svg?height=32&width=32" // Fallback para placeholder
    } else {
      console.log("✨ AppContent: Settings ainda não carregados ou nulos.")
    }
  }, [settings]) // Depende das configurações da loja

  if (settingsLoading) {
    // Opcional: Mostrar um loader enquanto as configurações são carregadas
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando configurações da loja...</p>
      </div>
    )
  }

  if (settingsError) {
    // Opcional: Mostrar uma mensagem de erro se as configurações não puderem ser carregadas
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>Erro ao carregar configurações da loja: {settingsError}</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

// O componente App principal agora renderiza o AppContent
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent /> {/* Renderiza o novo componente AppContent aqui */}
    </TooltipProvider>
  </QueryClientProvider>
)

createRoot(document.getElementById("root")!).render(<App />)
