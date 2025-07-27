"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Upload, Crop, Save } from "lucide-react"
import ReactCrop, { type Crop as CropType, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import type { Product, ProductInsert, ProductUpdate } from "@/lib/supabase"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/hooks/use-toast"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: ProductInsert | ProductUpdate) => Promise<boolean>
  product?: Product | null
  mode: "add" | "edit"
}

const AVAILABLE_SIZES = ["P", "M", "G", "GG", "XG"]

// Categorias serão obtidas do banco via hook useCategories
// Categorias que precisam de tamanho
const CATEGORIES_WITH_SIZES = ["Blusas", "Camisas", "Vestidos", "Calças", "Acessórios", "Sapatos"]
const CATEGORIES_WITHOUT_SIZES = ["Perfumes"]

export default function ProductModal({ isOpen, onClose, onSave, product, mode }: ProductModalProps) {
  const { activeCategories } = useCategories()
  const { toast } = useToast()

  // Função para converter dataURL em blob de forma segura
  const dataURLToBlob = (dataURL: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      fetch(dataURL)
        .then((res) => res.blob())
        .then((blob) => resolve(blob))
        .catch(reject)
    })
  }

  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || 0,
    category: product?.category || "",
    stock: product?.stock || 0,
    status: product?.status || ("active" as "active" | "inactive"),
  })

  // Log quando product prop muda
  useEffect(() => {
    console.log("📝 === PRODUCT PROP MUDOU NO MODAL ===")
    console.log("📝 Novo product:", product)
    console.log("📝 Mode:", mode)
    console.log("📝 Modal isOpen:", isOpen)
    console.log("📝 ================================")
    if (product && mode === "edit") {
      resetForm()
    }
  }, [product, mode, isOpen])

  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes || [])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(product?.image || "")
  const [imageFile2, setImageFile2] = useState<File | null>(null)
  const [imagePreview2, setImagePreview2] = useState<string>(product?.image_2 || "")
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [showCropEditor, setShowCropEditor] = useState(false)
  const [currentImageEditing, setCurrentImageEditing] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef2 = useRef<HTMLInputElement>(null) // Novo ref para segunda imagem

  const resetForm = () => {
    console.log("🔄 === RESETANDO FORM DO MODAL ===")
    console.log("🔄 Product prop recebido:", product)
    console.log("🔄 Mode:", mode)
    console.log("🔄 ==============================")
    setFormData({
      name: product?.name || "",
      price: product?.price || 0,
      category: product?.category || "",
      stock: product?.stock || 0,
      status: product?.status || "active",
    })
    setSelectedSizes(product?.sizes || [])
    setImagePreview(product?.image || "")
    setImagePreview2(product?.image_2 || "")
    setImageFile(null)
    setImageFile2(null)
    setShowCropEditor(false)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setCurrentImageEditing(1)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 = 1) => {
    const file = e.target.files?.[0]
    console.log(`📸 Selecionando imagem ${imageNumber}:`, file?.name)

    if (file) {
      if (imageNumber === 1) {
        setImageFile(file)
        setCurrentImageEditing(1)
      } else {
        setImageFile2(file)
        setCurrentImageEditing(2)
      }

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        console.log(`✅ Imagem ${imageNumber} carregada com sucesso`)

        if (imageNumber === 1) {
          setImagePreview(result)
        } else {
          setImagePreview2(result)
        }
        setShowCropEditor(true)
      }
      reader.onerror = () => {
        console.error(`❌ Erro ao ler arquivo de imagem ${imageNumber}`)
        toast({
          title: "Erro ao Carregar Imagem",
          description: "Erro ao carregar imagem. Tente outro arquivo.",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    } as CropType)
  }, [])

  // Validação específica por categoria
  const validateProductData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validações básicas para todos os produtos
    if (!formData.name.trim()) {
      errors.push("Nome do produto é obrigatório")
    }
    if (!formData.price || formData.price <= 0) {
      errors.push("Preço deve ser maior que zero")
    }
    if (!formData.category) {
      errors.push("Categoria é obrigatória")
    }

    // Estoque obrigatório
    if (formData.stock === undefined || formData.stock === null) {
      errors.push("Estoque é obrigatório")
    } else if (formData.stock < 0) {
      errors.push("Estoque deve ser zero ou maior")
    }

    // Validações específicas por categoria
    if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
      // Roupas e acessórios precisam de tamanho
      if (selectedSizes.length === 0) {
        errors.push("Selecione pelo menos um tamanho para esta categoria")
      }
    }

    if (CATEGORIES_WITHOUT_SIZES.includes(formData.category)) {
      // Perfumes não devem ter tamanho selecionado
      if (selectedSizes.length > 0) {
        errors.push("Perfumes não devem ter tamanhos selecionados")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const cropImage = useCallback(() => {
    if (!completedCrop || !imgRef.current) return

    // Criar canvas para crop da imagem
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    // Tratamento para tainted canvas (cross-origin images)
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })

            if (currentImageEditing === 1) {
              setImageFile(croppedFile)
              setImagePreview(canvas.toDataURL())
            } else {
              setImageFile2(croppedFile)
              setImagePreview2(canvas.toDataURL())
            }

            setShowCropEditor(false)
          }
        },
        "image/jpeg",
        0.9,
      )
    } catch (error) {
      console.warn("⚠️ Canvas tainted, using dataURL fallback:", error)
      // Fallback: usar toDataURL e converter para blob manualmente
      try {
        const dataURL = canvas.toDataURL("image/jpeg", 0.9)

        if (currentImageEditing === 1) {
          setImagePreview(dataURL)
        } else {
          setImagePreview2(dataURL)
        }

        // Usar função auxiliar para converter
        dataURLToBlob(dataURL)
          .then((blob) => {
            const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })
            if (currentImageEditing === 1) {
              setImageFile(croppedFile)
            } else {
              setImageFile2(croppedFile)
            }
          })
          .catch((err) => {
            console.error("Erro ao converter dataURL:", err)
            // Se tudo falhar, manter sem arquivo mas com preview
            if (currentImageEditing === 1) {
              setImageFile(null)
            } else {
              setImageFile2(null)
            }
          })
        setShowCropEditor(false)
      } catch (dataURLError) {
        console.error("❌ Erro com canvas tainted:", dataURLError)
        alert(
          "Erro ao processar imagem devido a restrições de segurança do navegador. Tente fazer upload de uma imagem do seu computador em vez de usar URLs externas.",
        )
        setShowCropEditor(false)
      }
    }
  }, [completedCrop, currentImageEditing])

  const uploadImage = async (file: File): Promise<string> => {
    console.log("📤 Processando imagem:", file.name)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        console.log("✅ Imagem processada com sucesso (base64)")
        resolve(result)
      }
      reader.onerror = () => {
        console.error("❌ Erro ao processar imagem, usando placeholder")
        // Fallback para placeholder se até o FileReader falhar
        resolve(`https://via.placeholder.com/400x500/e2e8f0/64748b?text=Produto`)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar dados antes de prosseguir
    const validation = validateProductData()
    if (!validation.isValid) {
      toast({
        title: "Erro de Validação",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let imageUrl = imagePreview
      let imageUrl2 = imagePreview2

      if (imageFile) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadImage(imageFile)
        } finally {
          setIsUploadingImage(false)
        }
      }

      if (imageFile2) {
        setIsUploadingImage(true)
        try {
          imageUrl2 = await uploadImage(imageFile2)
        } finally {
          setIsUploadingImage(false)
        }
      }

      const productData = {
        ...formData,
        image: imageUrl,
        image_2: imageUrl2 || null,
        sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      }

      const success = await (mode === "edit" && product
        ? onSave({ id: product.id, ...productData })
        : onSave(productData))

      if (success) {
        toast({
          title: mode === "edit" ? "Produto Atualizado" : "Produto Criado",
          description: `${formData.name} foi ${mode === "edit" ? "atualizado" : "criado"} com sucesso!`,
          variant: "default",
        })
        handleClose()
      } else {
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o produto. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar produto"
      console.error("Detalhes do erro:", errorMessage)
      toast({
        title: "Erro Inesperado",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]))
  }

  const getCurrentImagePreview = () => {
    return currentImageEditing === 1 ? imagePreview : imagePreview2
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Adicionar Produto" : "Editar Produto"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Preencha as informações do novo produto" : "Atualize as informações do produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem Principal */}
          <div className="space-y-3">
            <Label>Imagem Principal do Produto</Label>

            {!showCropEditor && (
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {imagePreview ? "Trocar Imagem" : "Selecionar Imagem"}
                  </Button>

                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentImageEditing(1)
                        setShowCropEditor(true)
                      }}
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 1)}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Segunda Imagem */}
          <div className="space-y-3">
            <Label>Segunda Imagem (Verso/Lateral) - Opcional</Label>
            <div className="space-y-3">
              {imagePreview2 && (
                <div className="relative">
                  <img
                    src={imagePreview2 || "/placeholder.svg"}
                    alt="Preview 2"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef2.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview2 ? "Trocar Imagem 2" : "Adicionar Imagem 2"}
                </Button>

                {imagePreview2 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentImageEditing(2)
                        setShowCropEditor(true)
                      }}
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImagePreview2("")
                        setImageFile2(null)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef2}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, 2)}
                className="hidden"
              />
            </div>
          </div>

          {/* Editor de Crop */}
          {showCropEditor && getCurrentImagePreview() && (
            <div className="space-y-3">
              <Label>Editar Imagem {currentImageEditing === 1 ? "Principal" : "Secundária"}</Label>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={4 / 5}
              >
                <img
                  ref={imgRef}
                  src={getCurrentImagePreview() || "/placeholder.svg"}
                  onLoad={onImageLoad}
                  className="max-w-full h-auto"
                  crossOrigin="anonymous"
                />
              </ReactCrop>

              <div className="flex space-x-2">
                <Button type="button" onClick={cropImage} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Aplicar Corte
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCropEditor(false)} size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={formData.price === 0 ? "" : formData.price.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setFormData((prev) => ({ ...prev, price: value === "" ? 0 : Number.parseFloat(value) || 0 }))
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.length > 0
                    ? activeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    : ["Blusas", "Camisas", "Vestidos", "Calças", "Perfumes", "Acessórios", "Sapatos"].map(
                        (category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ),
                      )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.stock === 0 ? "" : formData.stock.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^\d+$/.test(value)) {
                    setFormData((prev) => ({ ...prev, stock: value === "" ? 0 : Number.parseInt(value) || 0 }))
                  }
                }}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Tamanhos */}
          <div className="space-y-3">
            <Label>
              Tamanhos Disponíveis
              {CATEGORIES_WITH_SIZES.includes(formData.category) && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {CATEGORIES_WITHOUT_SIZES.includes(formData.category) && (
              <p className="text-sm text-gray-500 italic">Perfumes não utilizam tamanhos</p>
            )}
            {!CATEGORIES_WITHOUT_SIZES.includes(formData.category) && (
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${size}`}
                      checked={selectedSizes.includes(size)}
                      onCheckedChange={() => toggleSize(size)}
                    />
                    <Label htmlFor={`size-${size}`} className="text-sm">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {selectedSizes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedSizes.map((size) => (
                  <Badge key={size} variant="secondary" className="text-xs">
                    {size}
                    <button type="button" onClick={() => toggleSize(size)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as "active" | "inactive" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isUploadingImage
                ? "Enviando imagem..."
                : isLoading
                  ? "Salvando..."
                  : mode === "add"
                    ? "Adicionar"
                    : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
