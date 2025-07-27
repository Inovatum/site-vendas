"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import {
  Plus,
  Edit2,
  Trash2,
  Settings,
  Package,
  MessageCircle,
  BarChart3,
  LogOut,
  Loader2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, useNavigate } from "react-router-dom"
import { useProducts } from "@/hooks/useProducts"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { useStoreCustomization } from "@/hooks/useStoreCustomization"
import { useCategories } from "@/hooks/useCategories"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { useToast } from "@/hooks/use-toast"
import ProductModal from "@/components/ProductModal"
import VisualCustomization from "@/components/VisualCustomization"
import DynamicStyles from "@/components/DynamicStyles"
import type { Product, ProductInsert, ProductUpdate } from "@/lib/supabase"
import { convertFileToBase64 } from "@/lib/image-utils" // Importar a nova função de conversão

export default function Admin() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [tempStoreName, setTempStoreName] = useState("")
  const [tempWhatsappNumber, setTempWhatsappNumber] = useState("")
  const [tempFooterText, setTempFooterText] = useState("")
  const [tempFooterCompanyName, setTempFooterCompanyName] = useState("")
  // NOVOS ESTADOS PARA TÍTULO DA ABA E FAVICON
  const [tempBrowserTabTitle, setTempBrowserTabTitle] = useState("")
  const [tempFaviconUrl, setTempFaviconUrl] = useState<string | null>(null) // Pode ser null se não houver favicon
  const [faviconFile, setFaviconFile] = useState<File | null>(null) // Estado para o arquivo selecionado
  // Removido isUploadingFavicon, pois a conversão é local
  // FIM NOVOS ESTADOS
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const navigate = useNavigate()

  const {
    products,
    loading,
    error,
    isConnected,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus: toggleStatus,
  } = useProducts()

  const { settings, loading: settingsLoading, updateSettings, error: settingsError } = useStoreSettings()

  const { customization, loading: customizationLoading } = useStoreCustomization()
  const { categories, addCategory, deleteCategory, toggleCategoryStatus } = useCategories()
  const { checkAuth, isAuthenticated, logout } = useAdminAuth()
  const { toast } = useToast()

  useEffect(() => {
    const isAuth = checkAuth()
    if (!isAuth) {
      navigate("/admin-login")
    }
  }, [navigate, checkAuth]) // checkAuth deve estar nas dependências

  useEffect(() => {
    // Inicializar campos temporários quando settings carregarem
    if (settings) {
      setTempStoreName(settings.store_name)
      setTempWhatsappNumber(settings.whatsapp_number)
      setTempFooterText(settings.footer_text || "© 2024 Minha Loja. Todos os direitos reservados.")
      setTempFooterCompanyName(settings.footer_company_name || "Minha Loja")
      // Inicializar novos campos
      setTempBrowserTabTitle(settings.browser_tab_title || "Loja Rafael - Admin")
      setTempFaviconUrl(settings.favicon_url || null) // Inicializar com URL existente ou null
    }
  }, [settings])

  const handleLogout = () => {
    logout() // Chamar a função logout do hook useAdminAuth
    navigate("/admin-login")
  }

  const activeProducts = products.filter((p) => p.status === "active")
  const totalProducts = products.length
  const whatsappProducts = activeProducts.length

  const statsCards = [
    {
      title: "Total de Produtos",
      value: totalProducts,
      description: "produtos cadastrados",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Produtos WhatsApp",
      value: whatsappProducts,
      description: "ativos no WhatsApp",
      icon: MessageCircle,
      color: "text-green-600",
    },
    {
      title: "Vendas do Mês",
      value: settings?.monthly_sales || 0,
      description: "vendas realizadas",
      icon: BarChart3,
      color: "text-primary",
    },
  ]

  const handleAddProduct = () => {
    setModalMode("add")
    setEditingProduct(null)
    setIsProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    console.log("🔧 === INICIANDO EDIÇÃO ===")
    console.log("🔧 Produto clicado para editar:")
    console.log("   - ID:", product.id)
    console.log("   - Nome:", product.name)
    console.log("   - Categoria:", product.category)
    console.log("   - Preço:", product.price)
    console.log("🔧 Estado atual de editingProduct:", editingProduct?.name || "null")
    console.log(
      "🔧 Lista completa de produtos:",
      products.map((p) => ({ id: p.id, name: p.name })),
    )
    console.log("🔧 ========================")
    setModalMode("edit")
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (productData: ProductInsert | ProductUpdate): Promise<boolean> => {
    if (modalMode === "add") {
      return await addProduct(productData as ProductInsert)
    } else {
      return await updateProduct(productData as ProductUpdate)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    console.log("🗑️ Deletando produto ID:", id)
    const success = await deleteProduct(id)
    if (!success) {
      console.error("Falha ao deletar produto")
    }
  }

  const handleToggleStatus = async (id: number) => {
    console.log("🔄 Alternando status do produto ID:", id)
    const success = await toggleStatus(id)
    if (!success) {
      console.error("Falha ao alterar status do produto")
    }
  }

  // NOVA FUNÇÃO PARA MANIPULAR A SELEÇÃO DO ARQUIVO FAVICON
  const handleFaviconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFaviconFile(file)
      // Mostra uma prévia local do arquivo selecionado (Base64)
      const reader = new FileReader()
      reader.onload = () => {
        setTempFaviconUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFaviconFile(null)
      // Se nenhum arquivo for selecionado, reverte para o favicon salvo ou padrão
      setTempFaviconUrl(settings?.favicon_url || null)
    }
  }

  // NOVA FUNÇÃO PARA LIMPAR O FAVICON
  const handleClearFavicon = () => {
    setFaviconFile(null)
    setTempFaviconUrl(null) // Limpa a prévia/URL atual
    // Ao salvar, isso definirá favicon_url como null no DB
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    let finalFaviconUrl = tempFaviconUrl // Começa com a URL atual ou definida manualmente

    try {
      if (faviconFile) {
        // Converte o arquivo para Base64 antes de salvar no banco
        toast({
          title: "Processando Favicon",
          description: "Convertendo imagem do favicon...",
          duration: 3000,
        })
        finalFaviconUrl = await convertFileToBase64(faviconFile)
        toast({
          title: "Processamento Concluído",
          description: "Favicon pronto para salvar!",
          variant: "default",
        })
      }

      if (settings) {
        const success = await updateSettings({
          store_name: tempStoreName,
          whatsapp_number: tempWhatsappNumber,
          footer_text: tempFooterText,
          footer_company_name: tempFooterCompanyName,
          browser_tab_title: tempBrowserTabTitle, // Incluir o novo campo
          favicon_url: finalFaviconUrl, // Incluir o novo campo (agora Base64 ou null)
        })
        if (success) {
          console.log("Configurações salvas com sucesso!")
        }
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações da loja.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
      setFaviconFile(null) // Limpa o input de arquivo após salvar
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "Digite um nome para a categoria",
        variant: "destructive",
      })
      return
    }
    const categoryName = newCategoryName.trim()
    const exists = categories.find((cat) => cat.name.toLowerCase() === categoryName.toLowerCase())
    if (exists) {
      toast({
        title: "Categoria Já Existe",
        description: `A categoria "${categoryName}" já foi criada anteriormente.`,
        variant: "destructive",
      })
      return
    }
    console.log("🏷️ Tentando adicionar categoria:", categoryName)
    const success = await addCategory({
      name: categoryName,
      display_order: categories.length + 1,
    })
    if (success) {
      setNewCategoryName("")
      toast({
        title: "Categoria Adicionada",
        description: `"${categoryName}" foi criada com sucesso!`,
        variant: "default",
      })
      console.log("✅ Categoria adicionada com sucesso!")
    } else {
      toast({
        title: "Erro ao Adicionar",
        description: "Não foi possível criar a categoria. Verifique os logs do console.",
        variant: "destructive",
      })
      console.error("❌ Falha ao adicionar categoria")
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteCategory(id)
    }
  }

  const handleToggleCategoryStatus = async (id: number) => {
    await toggleCategoryStatus(id)
  }

  // Adicionado tratamento de carregamento e erro para autenticação e configurações
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Carregando configurações da loja...</p>
        </div>
      </div>
    )
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao Carregar Configurações</h1>
          <p className="text-gray-700 mb-4">Ocorreu um erro ao carregar as configurações da loja: {settingsError}</p>
          <p className="text-gray-500">
            Por favor, verifique sua conexão com o Supabase e se a tabela `store_settings` está configurada
            corretamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (customizationLoading || !customization) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DynamicStyles customization={customization} />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {customization.show_logo &&
                  (customization.logo_url ? (
                    <img
                      src={customization.logo_url || "/placeholder.svg"}
                      alt="Logo"
                      className={`object-cover logo-${customization.logo_size}`}
                    />
                  ) : (
                    <div
                      className={`bg-primary rounded-full flex items-center justify-center logo-container-${customization.logo_size}`}
                    >
                      <span className="text-white font-bold text-sm">
                        {settings?.store_name?.charAt(0)?.toUpperCase() || "L"}
                      </span>
                    </div>
                  ))}
                <span className="text-xl font-bold text-gray-900">{settings?.store_name || "Minha Loja"}</span>
              </div>
              <Badge variant="secondary" className="ml-4">
                Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Ver Loja</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie produtos, pedidos e usuários</p>
          {/* Connection Status */}
          {!isConnected && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Offline:</strong> Banco de dados não conectado - funcionalidades limitadas
              </p>
            </div>
          )}
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:col-span-3 gap-8">
          {/* Products Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Produtos</CardTitle>
                    <CardDescription>Adicione, edite e remova produtos do catálogo</CardDescription>
                  </div>
                  <Button onClick={handleAddProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-600">Erro ao carregar produtos: {error}</p>
                    </div>
                  </div>
                )}
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600">Carregando produtos...</p>
                  </div>
                )}
                {/* Empty State */}
                {!loading && !error && products.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Nenhum produto cadastrado ainda.</p>
                  </div>
                )}
                {/* Products List */}
                {!loading && !error && products.length > 0 && (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg hover:bg-gray-50 overflow-hidden">
                        {/* Layout Desktop */}
                        <div className="hidden sm:flex items-center space-x-4 p-4">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-primary font-semibold">R$ {product.price.toFixed(2)}</span>
                              {product.stock && <span className="text-sm text-gray-500">Estoque: {product.stock}</span>}
                              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                {product.status === "active" ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            {/* Tamanhos */}
                            {product.sizes && product.sizes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {product.sizes.map((size, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {size}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                console.log("👆 CLIQUE NO BOTÃO EDITAR")
                                console.log("👆 Produto no loop atual:", product.id, product.name)
                                handleEditProduct(product)
                              }}
                              title="Editar produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleStatus(product.id)}
                              className={product.status === "active" ? "text-green-600" : "text-gray-500"}
                              title={product.status === "active" ? "Desativar produto" : "Ativar produto"}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Layout Mobile */}
                        <div className="sm:hidden p-4">
                          <div className="flex space-x-3 mb-3">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-primary font-semibold text-sm">
                                  R$ {product.price.toFixed(2)}
                                </span>
                                <Badge
                                  variant={product.status === "active" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {product.status === "active" ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {/* Informações adicionais mobile */}
                          <div className="space-y-2 mb-3">
                            {product.stock && <div className="text-xs text-gray-500">Estoque: {product.stock}</div>}
                            {/* Tamanhos mobile */}
                            {product.sizes && product.sizes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.sizes.map((size, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {size}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Botões mobile - separados em linha própria */}
                          <div className="border-t pt-3">
                            <div className="flex justify-center space-x-6">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  console.log("👆 CLIQUE NO BOTÃO EDITAR")
                                  console.log("👆 Produto no loop atual:", product.id, product.name)
                                  handleEditProduct(product)
                                }}
                                className="flex flex-col items-center space-y-1 h-auto py-2"
                              >
                                <Edit2 className="w-5 h-5" />
                                <span className="text-xs">Editar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(product.id)}
                                className={`flex flex-col items-center space-y-1 h-auto py-2 ${
                                  product.status === "active" ? "text-green-600" : "text-gray-500"
                                }`}
                              >
                                <Settings className="w-5 h-5" />
                                <span className="text-xs">{product.status === "active" ? "Desativar" : "Ativar"}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Excluir produto"
                              >
                                <Trash2 className="w-5 h-5" />
                                <span className="text-xs">Excluir</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Categories Management */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Categorias</CardTitle>
                <CardDescription>Gerencie as categorias dos produtos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Category */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nome da nova categoria"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {/* Categories List */}
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleCategoryStatus(category.id)}
                          className={category.is_active ? "text-green-600" : "text-gray-500"}
                          title={category.is_active ? "Desativar categoria" : "Ativar categoria"}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                          title="Excluir categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Loja</CardTitle>
                <CardDescription>Configure nome da loja, WhatsApp e rodapé</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome da Loja</label>
                  <Input
                    value={tempStoreName}
                    onChange={(e) => setTempStoreName(e.target.value)}
                    placeholder="Nome da sua loja"
                    className="mt-1"
                    disabled={isSavingSettings} // Ajustado para isSavingSettings
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Número do WhatsApp</label>
                  <Input
                    value={tempWhatsappNumber}
                    onChange={(e) => setTempWhatsappNumber(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                    disabled={isSavingSettings} // Ajustado para isSavingSettings
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Texto do Rodapé</label>
                  <Input
                    value={tempFooterText}
                    onChange={(e) => setTempFooterText(e.target.value)}
                    placeholder="© 2024 Minha Loja. Todos os direitos reservados."
                    className="mt-1"
                    disabled={isSavingSettings} // Ajustado para isSavingSettings
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome da Empresa no Rodapé</label>
                  <Input
                    value={tempFooterCompanyName}
                    onChange={(e) => setTempFooterCompanyName(e.target.value)}
                    placeholder="Minha Loja"
                    className="mt-1"
                    disabled={isSavingSettings} // Ajustado para isSavingSettings
                  />
                </div>
                {/* NOVOS CAMPOS PARA TÍTULO DA ABA DO NAVEGADOR E FAVICON */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Título da Aba do Navegador</label>
                  <Input
                    value={tempBrowserTabTitle}
                    onChange={(e) => setTempBrowserTabTitle(e.target.value)}
                    placeholder="Título da aba do navegador"
                    className="mt-1"
                    disabled={isSavingSettings} // Ajustado para isSavingSettings
                  />
                  <p className="text-xs text-gray-500 mt-1">Este texto aparecerá na aba do navegador.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Favicon</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="flex-1"
                      disabled={isSavingSettings} // Ajustado para isSavingSettings
                    />
                    {tempFaviconUrl && (
                      <>
                        <img
                          src={tempFaviconUrl || "/placeholder.svg"}
                          alt="Favicon Preview"
                          className="w-8 h-8 object-contain rounded-md"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearFavicon}
                          disabled={isSavingSettings} // Ajustado para isSavingSettings
                          title="Remover Favicon"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione uma imagem para usar como favicon. Tamanho recomendado: 32x32 pixels.
                  </p>
                  {isSavingSettings && ( // Usar isSavingSettings para indicar processamento
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando configurações...
                    </div>
                  )}
                </div>
                {/* FIM NOVOS CAMPOS */}
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || settingsLoading} // Removido isUploadingFavicon
                  className="w-full"
                >
                  {isSavingSettings ? "Salvando..." : "Salvar Configurações"}
                </Button>
                <div className="text-xs text-gray-500 mt-4">
                  Clique em "Salvar Configurações" para aplicar as mudanças.
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>

 {/* Separador */}
        <div className="text-xs text-gray-500 mt-4">
                  
                </div>
        {/* Visual Customization Section */}
        <VisualCustomization />
      </div>
      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        mode={modalMode}
      />
    </div>
  )
}
