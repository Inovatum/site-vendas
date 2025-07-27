import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { useStoreCustomization } from '@/hooks/useStoreCustomization';
import { useToast } from '@/hooks/use-toast';

interface VisualCustomizationProps {
  // Removido - agora usa hook interno
}

export default function VisualCustomization() {
  const { customization, loading, error, updateCustomization } = useStoreCustomization();
  const { toast } = useToast();

  const [tempSettings, setTempSettings] = useState({
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
    logo_url: '',
    logo_size: 'medium' as 'small' | 'medium' | 'large',
    show_logo: true,
    show_store_name: true,
    theme_style: 'modern' as 'modern' | 'classic' | 'minimal',
    custom_css: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (customization) {
      console.log('🔄 Carregando dados da customização:', customization);
      setTempSettings({
        primary_color: customization.primary_color || '#e11d48',
        secondary_color: customization.secondary_color || '#f1f5f9',
        accent_color: customization.accent_color || '#0f172a',
        background_color: customization.background_color || '#ffffff',
        text_color: customization.text_color || '#1f2937',
        button_color: customization.button_color || '#e11d48',
        button_text_color: customization.button_text_color || '#ffffff',
        site_background_color: customization.site_background_color || '#f8fafc',
        card_background_color: customization.card_background_color || '#ffffff',
        card_border_color: customization.card_border_color || '#e2e8f0',
        header_color: customization.header_color || '#ffffff',
        footer_color: customization.footer_color || '#ffffff',
        cart_color: customization.cart_color || '#ffffff',
        menu_color: customization.menu_color || '#f8fafc',
        logo_url: customization.logo_url || '',
        logo_size: customization.logo_size || 'medium',
        show_logo: customization.show_logo ?? true,
        show_store_name: customization.show_store_name ?? true,
        theme_style: customization.theme_style || 'modern',
        custom_css: customization.custom_css || ''
      });
    }
  }, [customization]);

  const handleColorChange = (field: string, value: string) => {
    setTempSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Converter para base64 para preview
      const reader = new FileReader();
      reader.onload = () => {
        setTempSettings(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Tentando salvar personalização...', tempSettings);
      const success = await updateCustomization(tempSettings);
      if (success) {
        console.log('✅ Personalização salva com sucesso!');
        toast({
          title: "Personalização Salva",
          description: "As mudanças foram aplicadas com sucesso!",
          variant: "default",
        });
      } else {
        console.error('❌ Falha ao salvar personalização');
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar a personalização. Verifique o console.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar personalização:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar personalização';
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const presetColors = {
    'Rosa/Magenta': {
      primary_color: '#e11d48',
      button_color: '#e11d48',
      accent_color: '#0f172a'
    },
    'Azul': {
      primary_color: '#3b82f6',
      button_color: '#3b82f6',
      accent_color: '#1e293b'
    },
    'Verde': {
      primary_color: '#10b981',
      button_color: '#10b981',
      accent_color: '#064e3b'
    },
    'Roxo': {
      primary_color: '#8b5cf6',
      button_color: '#8b5cf6',
      accent_color: '#312e81'
    },
    'Laranja': {
      primary_color: '#f97316',
      button_color: '#f97316',
      accent_color: '#9a3412'
    }
  };

  const applyPreset = (preset: keyof typeof presetColors) => {
    setTempSettings(prev => ({ ...prev, ...presetColors[preset] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>Personalização Visual</span>
        </CardTitle>
        <CardDescription>
          Customize as cores, logo e aparência da sua loja
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Cores</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          {/* Aba de Cores */}
          <TabsContent value="colors" className="space-y-6">
            {/* Presets de Cores */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Paletas Prontas</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.keys(presetColors).map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset as keyof typeof presetColors)}
                    className="flex items-center space-x-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: presetColors[preset as keyof typeof presetColors].primary_color }}
                    />
                    <span className="text-xs">{preset}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Cores Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Cores Principais</h4>
                
                <div>
                  <Label htmlFor="primary">Cor Primária</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="primary"
                      type="color"
                      value={tempSettings.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      placeholder="#e11d48"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary">Cor Secundária</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="secondary"
                      type="color"
                      value={tempSettings.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      placeholder="#f1f5f9"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent">Cor de Destaque</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="accent"
                      type="color"
                      value={tempSettings.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      placeholder="#0f172a"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cores dos Botões</h4>
                
                <div>
                  <Label htmlFor="button">Cor dos Botões</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="button"
                      type="color"
                      value={tempSettings.button_color}
                      onChange={(e) => handleColorChange('button_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.button_color}
                      onChange={(e) => handleColorChange('button_color', e.target.value)}
                      placeholder="#e11d48"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="button-text">Texto dos Botões</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="button-text"
                      type="color"
                      value={tempSettings.button_text_color}
                      onChange={(e) => handleColorChange('button_text_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.button_text_color}
                      onChange={(e) => handleColorChange('button_text_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Preview do Botão */}
                <div className="mt-4">
                  <Label>Preview do Botão</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div
                      style={{
                        backgroundColor: tempSettings.button_color,
                        color: tempSettings.button_text_color,
                        border: `1px solid ${tempSettings.button_color}`,
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontWeight: '500',
                        display: 'inline-block',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      Adicionar ao Carrinho
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Este é o preview de como ficará o botão
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cores do Site e Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-4">
                <h4 className="font-medium">Cores do Site</h4>

                <div>
                  <Label htmlFor="site-bg">Fundo do Site</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="site-bg"
                      type="color"
                      value={tempSettings.site_background_color}
                      onChange={(e) => handleColorChange('site_background_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.site_background_color}
                      onChange={(e) => handleColorChange('site_background_color', e.target.value)}
                      placeholder="#f8fafc"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cores dos Cards</h4>

                <div>
                  <Label htmlFor="card-bg">Fundo dos Cards</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="card-bg"
                      type="color"
                      value={tempSettings.card_background_color}
                      onChange={(e) => handleColorChange('card_background_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.card_background_color}
                      onChange={(e) => handleColorChange('card_background_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="card-border">Borda dos Cards</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="card-border"
                      type="color"
                      value={tempSettings.card_border_color}
                      onChange={(e) => handleColorChange('card_border_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.card_border_color}
                      onChange={(e) => handleColorChange('card_border_color', e.target.value)}
                      placeholder="#e2e8f0"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Preview do Layout */}
                <div className="mt-6">
                  <Label>Preview do Layout</Label>
                  <div className="mt-2 p-4 border rounded-lg" style={{ backgroundColor: tempSettings.site_background_color }}>
                    <div
                      className="p-3 rounded border mb-2"
                      style={{ backgroundColor: tempSettings.card_background_color, borderColor: tempSettings.card_border_color }}
                    >
                      <p style={{ color: tempSettings.text_color }} className="text-sm">
                        Card de produto no fundo do site
                      </p>
                    </div>
                    <div
                      className="p-2 rounded text-center text-sm"
                      style={{ backgroundColor: tempSettings.header_color, borderColor: tempSettings.card_border_color }}
                    >
                      Header da loja
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cores do Header e Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-4">
                <h4 className="font-medium">Cores do Header</h4>

                <div>
                  <Label htmlFor="header-color">Fundo do Header</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="header-color"
                      type="color"
                      value={tempSettings.header_color}
                      onChange={(e) => handleColorChange('header_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.header_color}
                      onChange={(e) => handleColorChange('header_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cores do Footer</h4>

                <div>
                  <Label htmlFor="footer-color">Fundo do Footer</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="footer-color"
                      type="color"
                      value={tempSettings.footer_color}
                      onChange={(e) => handleColorChange('footer_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.footer_color}
                      onChange={(e) => handleColorChange('footer_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cores do Carrinho e Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-4">
                <h4 className="font-medium">Cores do Carrinho</h4>

                <div>
                  <Label htmlFor="cart-color">Fundo do Carrinho</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="cart-color"
                      type="color"
                      value={tempSettings.cart_color}
                      onChange={(e) => handleColorChange('cart_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.cart_color}
                      onChange={(e) => handleColorChange('cart_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cores do Menu</h4>

                <div>
                  <Label htmlFor="menu-color">Fundo do Menu</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="menu-color"
                      type="color"
                      value={tempSettings.menu_color}
                      onChange={(e) => handleColorChange('menu_color', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={tempSettings.menu_color}
                      onChange={(e) => handleColorChange('menu_color', e.target.value)}
                      placeholder="#f8fafc"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba de Logo */}
          <TabsContent value="logo" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo-upload">Upload do Logo</Label>
                <div className="mt-2">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logo-size">Tamanho do Logo</Label>
                <Select
                  value={tempSettings.logo_size}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    setTempSettings(prev => ({ ...prev, logo_size: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno (32px)</SelectItem>
                    <SelectItem value="medium">Médio (40px)</SelectItem>
                    <SelectItem value="large">Grande (48px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tempSettings.logo_url && (
                <div>
                  <Label>Preview do Logo</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <img
                        src={tempSettings.logo_url}
                        alt="Logo preview"
                        className={`object-contain logo-${tempSettings.logo_size}`}
                      />
                      <span className="text-sm text-gray-600">
                        Tamanho: {tempSettings.logo_size === 'small' ? '32px' :
                                 tempSettings.logo_size === 'medium' ? '40px' : '48px'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba de Layout */}
          <TabsContent value="layout" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Logo</Label>
                  <p className="text-sm text-gray-500">Exibir logo no cabeçalho</p>
                </div>
                <Switch
                  checked={tempSettings.show_logo}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, show_logo: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Nome da Loja</Label>
                  <p className="text-sm text-gray-500">Exibir nome da loja no cabeçalho</p>
                </div>
                <Switch
                  checked={tempSettings.show_store_name}
                  onCheckedChange={(checked) => 
                    setTempSettings(prev => ({ ...prev, show_store_name: checked }))
                  }
                />
              </div>

              <div>
                <Label>Estilo do Tema</Label>
                <Select
                  value={tempSettings.theme_style}
                  onValueChange={(value) => 
                    setTempSettings(prev => ({ ...prev, theme_style: value as 'modern' | 'classic' | 'minimal' }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Moderno</SelectItem>
                    <SelectItem value="classic">Clássico</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Aba Avançada */}
          <TabsContent value="advanced" className="space-y-6">
            <div>
              <Label htmlFor="custom-css">CSS Personalizado</Label>
              <textarea
                id="custom-css"
                value={tempSettings.custom_css}
                onChange={(e) => setTempSettings(prev => ({ ...prev, custom_css: e.target.value }))}
                placeholder="/* Adicione seu CSS personalizado aqui */
.custom-button {
  border-radius: 20px;
}"
                className="mt-2 w-full h-32 p-3 border rounded-md font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                CSS avançado para personalizaç��es específicas
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Personalização'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
