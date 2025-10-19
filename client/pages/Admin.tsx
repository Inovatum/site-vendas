"use client"

import { useState } from "react"
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { useProducts } from "@/hooks/useProducts"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { useStoreCustomization } from "@/hooks/useStoreCustomization"
import { useCategories } from "@/hooks/useCategories"
import DynamicStyles from "@/components/DynamicStyles"
import { supabase, supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_ANON_KEY } from "@/lib/supabase" // Importar supabase client and envs
import type { Product } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import PixModal from "@/components/PixModal"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAdminAuth } from "@/hooks/useAdminAuth"

interface CartItem extends Product {
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

// Função auxiliar para escurecer cor
function darkenColor(hex: string, percent: number): string {
  if (!hex || !hex.startsWith("#")) return hex
  const num = Number.parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = ((num >> 8) & 0x00ff) - amt
  const B = (num & 0x0000ff) - amt
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`
}

export default function Index() {
  const navigate = useNavigate()
  const { isAuthenticated, checkAuth } = useAdminAuth()

  useEffect(() => {
    // Ensure auth state is checked and redirect to login if not authenticated
    try {
      const auth = checkAuth()
      if (!auth) {
        navigate('/admin-login')
        return
      }
    } catch (e) {
      navigate('/admin-login')
      return
    }

  }, [isAuthenticated, checkAuth, navigate])

  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: string }>({})
  const [activeImages, setActiveImages] = useState<{ [key: number]: number }>({})
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [dynamicPixCode, setDynamicPixCode] = useState<string | null>(null) // Novo estado para o código PIX dinâmico
  const [dynamicQrCodeUrl, setDynamicQrCodeUrl] = useState<string | null>(null) // Novo estado para a URL do QR Code dinâmico
  const [isGeneratingPix, setIsGeneratingPix] = useState(false) // Novo estado para loading do PIX
  // NOVOS ESTADOS PARA CUPOM
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    type: "percentage" | "fixed"
    value: number
    usageLimit: number | null // NOVO: Limite de uso
  } | null>(null)
  // FIM NOVOS ESTADOS PARA CUPOM

  const { products, loading, error, isConnected } = useProducts()
  const { settings, fetchSettings } = useStoreSettings() // Importar fetchSettings para revalidar
  const { customization, loading: customizationLoading } = useStoreCustomization()
  const { activeCategories } = useCategories()
  const { toast } = useToast()

  // Só mostrar produtos ativos na loja
  const activeProducts = products.filter((product) => product.status === "active")

  // Usar categorias do banco (com fallback para categorias dos produtos se não houver no banco)
  const categories =
    activeCategories.length > 0
      ? ["Todos", ...activeCategories.map((cat) => cat.name)]
      : ["Todos", ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = activeProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    // Verificar se está conectado ao banco
    if (!isConnected) {
      toast({
        title: "Erro de Conexão",
        description: "Não é possível adicionar ao carrinho: banco de dados offline",
        variant: "destructive",
      })
      return
    }
    // Verificar se o produto tem tamanhos e se um foi selecionado
    if (product.sizes && product.sizes.length > 0) {
      const selectedSize = selectedSizes[product.id]
      if (!selectedSize) {
        toast({
          title: "Tamanho Obrigatório",
          description: "Por favor, selecione um tamanho antes de adicionar ao carrinho.",
          variant: "destructive",
        })
        return
      }
    }
    const selectedSize = selectedSizes[product.id]
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id && item.selectedSize === selectedSize)
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          selectedSize: selectedSize,
        },
      ]
    })
    // Limpar seleção de tamanho após adicionar
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSizes((prev) => ({ ...prev, [product.id]: "" }))
    }
    // Toast de sucesso
    toast({
      title: "Produto Adicionado",
      description: `${product.name} foi adicionado ao carrinho!`,
      variant: "default",
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id))
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getFinalPrice = () => {
    let total = getTotalPrice()
    if (appliedCoupon) {
      if (appliedCoupon.type === "percentage") {
        total = total * (1 - appliedCoupon.value)
      } else if (appliedCoupon.type === "fixed") {
        total = Math.max(0, total - appliedCoupon.value) // Ensure total doesn't go below 0
      }
    }
    return total
  }

  const getDiscountAmount = () => {
    return getTotalPrice() - getFinalPrice()
  }

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Função para decrementar o uso do cupom no banco de dados
  const decrementCouponUsage = async (couponCode: string) => {
    if (!isConnected) {
      console.warn("Não conectado ao banco de dados, não é possível decrementar o uso do cupom.")
      return false
    }
    try {
      console.log(`Frontend: Chamando decrement_coupon_usage para "${couponCode}"`)
      const { data, error } = await supabase.rpc("decrement_coupon_usage", {
        p_coupon_code: couponCode,
      })

      if (error) {
        console.error("Frontend: Erro ao decrementar uso do cupom:", error)
        toast({
          title: "Erro no Cupom",
          description: `Não foi possível registrar o uso do cupom "${couponCode}".`,
          variant: "destructive",
        })
        return false
      }

      if (data === true) {
        console.log(`Frontend: Uso do cupom "${couponCode}" decrementado com sucesso.`)
        // Revalidar as configurações da loja para refletir o novo limite
        await fetchSettings()
        return true
      } else {
        console.warn(
          `Frontend: Cupom "${couponCode}" não decrementado (limite 0 ou ilimitado, ou código não encontrado).`,
        )
        return false
      }
    } catch (err) {
      console.error("Frontend: Erro inesperado ao chamar decrement_coupon_usage:", err)
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar registrar o uso do cupom.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleFinalizeOrder = async (method: "whatsapp" | "pix") => {
    if (!isConnected) {
      toast({
        title: "Erro de Conexão",
        description: "Não é possível finalizar pedido: banco de dados offline",
        variant: "destructive",
      })
      return
    }

    console.log("Iniciando finalização do pedido...")

    // VERIFICAÇÃO ADICIONAL PARA CUPOM ANTES DE PROSSEGUIR
    if (appliedCoupon) {
      console.log(`Cupom aplicado: ${appliedCoupon.code}. Verificando limite de uso...`)
      // Encontrar o cupom correspondente nas configurações mais recentes
      const currentCouponInSettings = [
        settings?.coupon_code_1 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_1,
              value: settings?.coupon_value_1,
              usageLimit: settings?.coupon_usage_limit_1,
              expiration: settings?.coupon_expiration_1,
            }
          : null,
        settings?.coupon_code_2 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_2,
              value: settings?.coupon_value_2,
              usageLimit: settings?.coupon_usage_limit_2,
              expiration: settings?.coupon_expiration_2,
            }
          : null,
        settings?.coupon_code_3 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_3,
              value: settings?.coupon_value_3,
              usageLimit: settings?.coupon_usage_limit_3,
              expiration: settings?.coupon_expiration_3,
            }
          : null,
      ].find((c) => c !== null)

      if (currentCouponInSettings) {
        console.log("Detalhes do cupom nas configurações:", currentCouponInSettings)
        // Verificar se o cupom expirou
        if (currentCouponInSettings.expiration) {
          const expirationDate = new Date(currentCouponInSettings.expiration)
          if (new Date() > expirationDate) {
            toast({
              title: "Cupom Expirado",
              description: `O cupom "${appliedCoupon.code}" expirou.`,
              variant: "destructive",
            })
            setAppliedCoupon(null) // Remover cupom aplicado
            setCouponInput("") // Limpar input
            return // Interromper o checkout
          }
        }

        // Verificar se o limite de uso foi atingido
        if (currentCouponInSettings.usageLimit !== null && currentCouponInSettings.usageLimit <= 0) {
          toast({
            title: "Cupom Esgotado",
            description: `O cupom "${appliedCoupon.code}" já atingiu seu limite de usos.`,
            variant: "destructive",
          })
          setAppliedCoupon(null) // Remover cupom aplicado
          setCouponInput("") // Limpar input
          return // Interromper o checkout
        }
      } else {
        // Se o cupom aplicado não for encontrado nas configurações (foi removido ou código inválido)
        toast({
          title: "Cupom Inválido",
          description: `O cupom "${appliedCoupon.code}" não é mais válido.`,
          variant: "destructive",
        })
        setAppliedCoupon(null) // Remover cupom aplicado
        setCouponInput("") // Limpar input
        return // Interromper o checkout
      }

      // Se o cupom ainda é válido, tentar decrementar o uso
      const couponDecrementedSuccessfully = await decrementCouponUsage(appliedCoupon.code)
      if (!couponDecrementedSuccessfully) {
        // Se o decremento falhar (ex: limite já 0 ou cupom não encontrado/válido para decremento), avisar e não prosseguir com o checkout
        toast({
          title: "Cupom Esgotado ou Inválido",
          description: `O cupom "${appliedCoupon.code}" não pode ser usado. Limite de usos atingido ou cupom inválido.`,
          variant: "destructive",
        })
        setAppliedCoupon(null) // Remover cupom aplicado
        setCouponInput("") // Limpar input
        return // Interromper o checkout
      }
    }

    console.log("Prosseguindo com a finalização do pedido...")

    if (method === "whatsapp") {
      const storeName = settings?.store_name || "Minha Loja"
      const message =
        `🛍️ *Pedido ${storeName}*\n\n` +
        cart
          .map(
            (item) =>
              `• ${item.name}\n` +
              (item.selectedSize ? `  Tamanho: ${item.selectedSize}\n` : "") +
              `  Quantidade: ${item.quantity}\n` +
              `  Preço unitário: R$ ${item.price.toFixed(2)}\n` +
              `  Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}\n`,
          )
          .join("\n") +
        `\n💰 *Total: R$ ${getTotalPrice().toFixed(2)}*\n` +
        (appliedCoupon ? `Desconto (${appliedCoupon.code}): -R$ ${getDiscountAmount().toFixed(2)}\n` : "") +
        `*Total Final: R$ ${getFinalPrice().toFixed(2)}*\n\n` +
        `Gostaria de finalizar este pedido!`
      const encodedMessage = encodeURIComponent(message)
      const whatsappNumber = settings?.whatsapp_number || "5511999999999"
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank")
      toast({
        title: "Redirecionando",
        description: "Abrindo WhatsApp para finalizar seu pedido...",
        variant: "default",
      })
    } else if (method === "pix") {
      setIsGeneratingPix(true)
      try {
        const finalPrice = getFinalPrice()
        console.log(`Chamando Edge Function para gerar PIX com valor: ${finalPrice}`)
        // Build function URL from configured supabase url (fallback to example project)
        const functionBase = SUPABASE_URL ? SUPABASE_URL.replace(/\/+$/, "") : "https://dkzbhymqatlnwkdhjyzd.supabase.co"
        const functionUrl = `${functionBase}/functions/v1/generate-pix`

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Provide anon key to the function (required if function is not public)
            ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } : {}),
          },
          body: JSON.stringify({ amount: finalPrice }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error("Erro ao gerar PIX da Edge Function:", data)
          toast({
            title: "Erro ao Gerar PIX",
            description: `Não foi possível gerar o código PIX. ${data.error || "Erro desconhecido"}`,
            variant: "destructive",
          })
          return
        }

        if (data && typeof data === "object" && "pix_code" in data && "qr_code_base64" in data) {
          setDynamicPixCode(data.pix_code)
          setDynamicQrCodeUrl(data.qr_code_base64)
          setIsPixModalOpen(true)
        } else {
          toast({
            title: "Erro ao Gerar PIX",
            description: "Resposta inesperada da função de geração PIX.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Erro inesperado na geração PIX:", err)
        toast({
          title: "Erro Inesperado",
          description: "Ocorreu um erro ao tentar gerar o PIX.",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingPix(false)
      }
    }
  }

  // FUNÇÃO PARA APLICAR CUPOM
  const handleApplyCoupon = () => {
    if (!isConnected) {
      toast({
        title: "Erro de Conexão",
        description: "Não é possível aplicar cupom: banco de dados offline",
        variant: "destructive",
      })
      return
    }
    if (!couponInput.trim()) {
      toast({
        title: "Cupom Vazio",
        description: "Por favor, digite um código de cupom.",
        variant: "destructive",
      })
      return
    }

    const inputCode = couponInput.trim().toUpperCase()
    let foundCoupon: {
      code: string
      type: "percentage" | "fixed"
      value: number
      expiration: string | null
      usageLimit: number | null // NOVO
    } | null = null

    const coupons = [
      {
        code: settings?.coupon_code_1,
        type: settings?.coupon_type_1,
        value: settings?.coupon_value_1,
        expiration: settings?.coupon_expiration_1,
        usageLimit: settings?.coupon_usage_limit_1, // NOVO
      },
      {
        code: settings?.coupon_code_2,
        type: settings?.coupon_type_2,
        value: settings?.coupon_value_2,
        expiration: settings?.coupon_expiration_2,
        usageLimit: settings?.coupon_usage_limit_2, // NOVO
      },
      {
        code: settings?.coupon_code_3,
        type: settings?.coupon_type_3,
        value: settings?.coupon_value_3,
        expiration: settings?.coupon_expiration_3,
        usageLimit: settings?.coupon_usage_limit_3, // NOVO
      },
    ]

    for (const coupon of coupons) {
      if (coupon.code?.toUpperCase() === inputCode && coupon.type && coupon.value !== null) {
        // Check expiration
        if (coupon.expiration) {
          const expirationDate = new Date(coupon.expiration)
          if (new Date() > expirationDate) {
            toast({
              title: "Cupom Expirado",
              description: `O cupom "${coupon.code}" expirou em ${expirationDate.toLocaleDateString()} às ${expirationDate.toLocaleTimeString()}.`,
              variant: "destructive",
            })
            return
          }
        }

        // Check usage limit (client-side only)
        // IMPORTANT: For a robust global usage limit, this check should be done server-side
        // and the usage count should be decremented in a transaction.
        if (coupon.usageLimit !== null && coupon.usageLimit <= 0) {
          toast({
            title: "Cupom Esgotado",
            description: `O cupom "${coupon.code}" já atingiu seu limite de usos.`,
            variant: "destructive",
          })
          return
        }

        foundCoupon = {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          expiration: coupon.expiration,
          usageLimit: coupon.usageLimit, // NOVO
        }
        break
      }
    }

    if (foundCoupon) {
      setAppliedCoupon(foundCoupon)
      toast({
        title: "Cupom Aplicado!",
        description: `Desconto de ${
          foundCoupon.type === "percentage"
            ? `${(foundCoupon.value * 100).toFixed(0)}%`
            : `R$ ${foundCoupon.value.toFixed(2)}`
        } aplicado com sucesso.`,
        variant: "default",
      })
    } else {
      setAppliedCoupon(null)
      toast({
        title: "Cupom Inválido",
        description: "O código do cupom inserido não é válido ou não está ativo.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput("")
    toast({
      title: "Cupom Removido",
      description: "O cupom de desconto foi removido.",
      variant: "default",
    })
  }
  // FIM FUNÇÕES DE CUPOM

  // Lógica para determinar se os botões de finalizar devem ser desabilitados
  const isCheckoutDisabled = () => {
    if (!isConnected) return true // Sempre desabilitar se não houver conexão
    if (cart.length === 0) return true // Desabilitar se o carrinho estiver vazio

    if (appliedCoupon) {
      // Encontrar o cupom correspondente nas configurações mais recentes
      const currentCouponInSettings = [
        settings?.coupon_code_1 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_1,
              value: settings?.coupon_value_1,
              usageLimit: settings?.coupon_usage_limit_1,
              expiration: settings?.coupon_expiration_1,
            }
          : null,
        settings?.coupon_code_2 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_2,
              value: settings?.coupon_value_2,
              usageLimit: settings?.coupon_usage_limit_2,
              expiration: settings?.coupon_expiration_2,
            }
          : null,
        settings?.coupon_code_3 === appliedCoupon.code
          ? {
              type: settings?.coupon_type_3,
              value: settings?.coupon_value_3,
              usageLimit: settings?.coupon_usage_limit_3,
              expiration: settings?.coupon_expiration_3,
            }
          : null,
      ].find((c) => c !== null)

      if (!currentCouponInSettings) {
        // Se o cupom aplicado não for encontrado nas configurações (foi removido ou código inválido)
        return true
      }

      // Verificar se o cupom expirou
      if (currentCouponInSettings.expiration) {
        const expirationDate = new Date(currentCouponInSettings.expiration)
        if (new Date() > expirationDate) {
          return true
        }
      }

      // Verificar se o limite de uso foi atingido
      if (currentCouponInSettings.usageLimit !== null && currentCouponInSettings.usageLimit <= 0) {
        return true
      }
    }
    return false
  }

  // Aguardar customização carregar para evitar flash de cores padrão
  if (customizationLoading || !customization) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      key={customization.id + customization.button_color}
      className="min-h-screen"
      style={{ backgroundColor: customization.site_background_color }}
    >
      <DynamicStyles customization={customization} />
      {/* Header */}
      <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: customization.header_color }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
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
                {customization.show_store_name && (
                  <span className="text-xl font-bold text-gray-900">{settings?.store_name || "Minha Loja"}</span>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar roupas, perfumes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="w-5 h-5" />
                {getCartItemsCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {getCartItemsCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Category Filter */}
      <div className="border-b menu-filter" style={{ backgroundColor: customization.menu_color }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${
                  selectedCategory === category
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nossos Produtos</h1>
          <p className="text-gray-600">Descubra as últimas tendências da moda e perfumes exclusivos</p>
          {/* Connection Status */}
          {!isConnected && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Offline:</strong> Banco de dados não conectado
              </p>
            </div>
          )}
        </div>
        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">Erro: {error}</p>
              <p className="text-sm text-red-500 mt-2">Verifique as configurações do banco de dados</p>
            </div>
          </div>
        )}
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        )}
        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && isConnected && (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum produto encontrado.</p>
            <p className="text-sm text-gray-500 mt-2">Adicione produtos no painel administrativo</p>
          </div>
        )}
        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col"
                style={{
                  backgroundColor: customization.card_background_color,
                  borderColor: customization.card_border_color,
                }}
              >
                <div
                  className="aspect-[3/4] overflow-hidden relative group"
                  onTouchStart={(e) => {
                    const touchStartX = e.changedTouches[0].clientX
                    const handleTouchEnd = (endEvent: TouchEvent) => {
                      const touchEndX = endEvent.changedTouches[0].clientX
                      const diff = touchStartX - touchEndX
                      const currentImage = activeImages[product.id] ?? 0
                      if (Math.abs(diff) > 30 && product.image_2) {
                        const nextImage = (currentImage + (diff > 0 ? 1 : -1) + 2) % 2
                        setActiveImages((prev) => ({
                          ...prev,
                          [product.id]: nextImage,
                        }))
                      }
                      document.removeEventListener("touchend", handleTouchEnd)
                    }
                    document.addEventListener("touchend", handleTouchEnd)
                  }}
                >
                  {/* Imagem principal com fade */}
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      (activeImages[product.id] ?? 0) === 0 ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  />
                  {/* Segunda imagem com fade */}
                  {product.image_2 && (
                    <img
                      src={product.image_2 || "/placeholder.svg"}
                      alt={product.name + " alternativa"}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        activeImages[product.id] === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                    />
                  )}
                  {/* Botões esquerda e direita */}
                  {product.image_2 && (
                    <>
                      {/* Botão voltar (<) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImages((prev) => {
                            const current = prev[product.id] ?? 0
                            const next = (current - 1 + 2) % 2
                            return { ...prev, [product.id]: next }
                          })
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl font-bold z-20 hover:scale-110 transition-transform"
                      >
                        ‹
                      </button>
                      {/* Botão avançar (>) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImages((prev) => {
                            const current = prev[product.id] ?? 0
                            const next = (current + 1) % 2
                            return { ...prev, [product.id]: next }
                          })
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl font-bold z-20 hover:scale-110 transition-transform"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{product.name}</h3>
                    <p className="text-primary font-bold mb-2 text-base sm:text-lg">R$ {product.price.toFixed(2)}</p>
                    {/* Seleção de Tamanhos - Agora sempre renderiza um div com min-height */}
                    {product.sizes && product.sizes.length > 0 ? (
                      <div className="mb-3 min-h-[70px]">
                        <p className="text-xs text-gray-500 mb-2">Escolha o tamanho:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((size, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                setSelectedSizes((prev) => ({
                                  ...prev,
                                  [product.id]: prev[product.id] === size ? "" : size,
                                }))
                              }
                              className={`text-xs px-2 py-1 border rounded transition-colors ${
                                selectedSizes[product.id] === size
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        {selectedSizes[product.id] && (
                          <p className="text-xs text-primary mt-1">Tamanho selecionado: {selectedSizes[product.id]}</p>
                        )}
                      </div>
                    ) : (
                      // Placeholder para manter a altura consistente quando não há tamanhos
                      <div className="mb-3 min-h-[70px]">{/* Conteúdo vazio para manter o espaçamento */}</div>
                    )}
                  </div>
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full mt-2"
                    size="sm"
                    disabled={!isConnected}
                    style={{
                      backgroundColor: customization.button_color,
                      color: customization.button_text_color,
                      border: `1px solid ${customization.button_color}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isConnected) return
                      e.currentTarget.style.backgroundColor = darkenColor(customization.button_color, 10)
                    }}
                    onMouseLeave={(e) => {
                      if (!isConnected) return
                      e.currentTarget.style.backgroundColor = customization.button_color
                    }}
                  >
                    {isConnected ? "Adicionar ao Carrinho" : "Offline"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="border-t mt-16" style={{ backgroundColor: customization.footer_color }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2"></div>
            <Link to="/admin" className="text-xs text-gray-500 hover:text-primary">
              Admin
            </Link>
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              {settings?.footer_text || "© 2024 Minha Loja. Todos os direitos reservados."}
            </p>
            <p className="text-gray-500 text-xs mt-2">{settings?.footer_company_name || "Minha Loja"}</p>
          </div>
        </div>
      </footer>
      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md shadow-xl cart-panel"
            style={{ backgroundColor: customization.cart_color }}
          >
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Carrinho de Compras</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Seu carrinho está vazio</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          {item.selectedSize && <p className="text-xs text-gray-500">Tamanho: {item.selectedSize}</p>}
                          <p className="text-primary font-semibold">R$ {item.price.toFixed(2)}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  {/* Seção de Cupom */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Cupom de Desconto</h3>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded-md">
                        <span className="text-sm text-green-800">
                          Cupom "{appliedCoupon.code}" aplicado (
                          {appliedCoupon.type === "percentage"
                            ? `${(appliedCoupon.value * 100).toFixed(0)}% OFF`
                            : `R$ ${appliedCoupon.value.toFixed(2)} OFF`}
                          )
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleRemoveCoupon}>
                          <X className="w-4 h-4 text-green-800" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Digite seu cupom"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="flex-1"
                          disabled={!isConnected}
                        />
                        <Button onClick={handleApplyCoupon} disabled={!isConnected}>
                          Aplicar
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Fim Seção de Cupom */}

                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span>R$ {getTotalPrice().toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span>-R$ {getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold text-primary">
                    <span>Total Final:</span>
                    <span>R$ {getFinalPrice().toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    style={{
                      backgroundColor: customization.button_color,
                      color: customization.button_text_color,
                      border: `1px solid ${customization.button_color}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkenColor(customization.button_color, 10)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = customization.button_color
                    }}
                    onClick={() => handleFinalizeOrder("whatsapp")}
                    disabled={isCheckoutDisabled()} // Adicionado disabled
                  >
                    {isCheckoutDisabled() ? "Finalizar (Cupom Esgotado/Offline)" : "Finalizar no WhatsApp"}
                  </Button>
                  {/* Botão PIX agora usa o estado de loading */}
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    onClick={() => handleFinalizeOrder("pix")}
                    disabled={isCheckoutDisabled() || isGeneratingPix} // Adicionado disabled e isGeneratingPix
                  >
                    {isGeneratingPix ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PIX...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Pagar com PIX
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* PixModal agora recebe os códigos dinâmicos */}
      {dynamicPixCode && dynamicQrCodeUrl && (
        <PixModal
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          pixCode={dynamicPixCode}
          qrCodeUrl={dynamicQrCodeUrl}
        />
      )}
    </div>
  )
}
