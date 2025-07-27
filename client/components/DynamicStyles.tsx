import React from 'react';
import { StoreCustomization } from '@/hooks/useStoreCustomization';

interface DynamicStylesProps {
  customization: StoreCustomization | null;
}

export default function DynamicStyles({ customization }: DynamicStylesProps) {
  if (!customization) {
    console.log('⚠️ DynamicStyles: customization é null/undefined');
    return null;
  }

  console.log('🎨 DynamicStyles aplicando:', {
    button_color: customization.button_color,
    primary_color: customization.primary_color,
    show_logo: customization.show_logo,
    show_store_name: customization.show_store_name,
    logo_url: customization.logo_url
  });

  console.log('🔧 Gerando CSS com cores:', customization.button_color, customization.primary_color);

  const styles = `
    :root {
      --primary: ${hexToHsl(customization.primary_color)};
      --primary-foreground: ${hexToHsl(customization.button_text_color)};
      --secondary: ${hexToHsl(customization.secondary_color)};
      --secondary-foreground: ${hexToHsl(customization.text_color)};
      --accent: ${hexToHsl(customization.accent_color)};
      --accent-foreground: ${hexToHsl(customization.button_text_color)};
      --background: ${hexToHsl(customization.background_color)};
      --foreground: ${hexToHsl(customization.text_color)};
      --button-bg: ${customization.button_color};
      --button-text: ${customization.button_text_color};
      --site-bg: ${customization.site_background_color};
      --card-bg: ${customization.card_background_color};
      --card-border: ${customization.card_border_color};
      --header-bg: ${customization.header_color};
      --footer-bg: ${customization.footer_color};
      --cart-bg: ${customization.cart_color};
      --menu-bg: ${customization.menu_color};
    }

    /* Aplicar cor primária */
    .text-primary {
      color: ${customization.primary_color} !important;
    }

    .border-primary {
      border-color: ${customization.primary_color} !important;
    }

    /* CSS de apoio - principalmente inline styles sendo usados */
    .hover-button-effect:hover {
      background-color: ${darkenColor(customization.button_color, 10)} !important;
    }

    /* Cores essenciais */
    .text-primary {
      color: ${customization.primary_color} !important;
    }

    .border-primary {
      border-color: ${customization.primary_color} !important;
    }

    /* Estilo do tema */
    ${customization.theme_style === 'minimal' ? `
      .card, .border {
        border-radius: 2px !important;
        border-width: 1px !important;
      }

      .shadow-sm, .shadow-md {
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }
    ` : ''}

    ${customization.theme_style === 'classic' ? `
      .card, .border {
        border-radius: 8px !important;
      }

      .shadow-sm {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      }

      .shadow-md {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
      }
    ` : ''}

    ${customization.theme_style === 'modern' ? `
      .card, .border {
        border-radius: 12px !important;
      }

      .shadow-sm {
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      }

      .shadow-md {
        box-shadow: 0 4px 6px rgba(0,0,0,0.07) !important;
      }
    ` : ''}

    /* Cores do site e cards */
    body, .bg-gray-50 {
      background-color: var(--site-bg) !important;
    }

    .card, .bg-white,
    [class*="bg-white"] {
      background-color: var(--card-bg) !important;
      border-color: var(--card-border) !important;
    }

    .border, .border-gray-200, .border-gray-300 {
      border-color: var(--card-border) !important;
    }

    /* Cores do header e footer */
    header, header.bg-white {
      background-color: var(--header-bg) !important;
    }

    footer, footer.bg-white {
      background-color: var(--footer-bg) !important;
    }

    /* Cores do carrinho e menu */
    .cart-panel {
      background-color: var(--cart-bg) !important;
    }

    .menu-filter, .category-filter {
      background-color: var(--menu-bg) !important;
    }

    /* Tamanhos do logo */
    .logo-small { width: 32px; height: 32px; border-radius: 50%; }
    .logo-medium { width: 40px; height: 40px; border-radius: 50%; }
    .logo-large { width: 48px; height: 48px; border-radius: 50%; }

    .logo-container-small { width: 32px; height: 32px; }
    .logo-container-medium { width: 40px; height: 40px; }
    .logo-container-large { width: 48px; height: 48px; }

    /* Estilos dos Toasts - seguindo o tema do site */
    [data-sonner-toaster] {
      --primary: ${customization.primary_color || '#e11d48'} !important;
      --success: ${customization.primary_color || '#e11d48'} !important;
    }

    [data-sonner-toast] {
      --primary: ${customization.primary_color || '#e11d48'} !important;
      --success: ${customization.primary_color || '#e11d48'} !important;
      background-color: var(--card-bg) !important;
      border-color: var(--card-border) !important;
      color: ${customization.text_color || '#1f2937'} !important;
    }

    [data-sonner-toast][data-type="success"] {
      background-color: var(--card-bg) !important;
      border-color: ${customization.primary_color || '#e11d48'} !important;
      color: ${customization.text_color || '#1f2937'} !important;
    }

    [data-sonner-toast][data-type="error"] {
      background-color: #fef2f2 !important;
      border-color: #dc2626 !important;
      color: #dc2626 !important;
    }

    /* Toast padrão do shadcn/ui */
    .toast {
      background-color: var(--card-bg) !important;
      border-color: var(--card-border) !important;
      color: ${customization.text_color || '#1f2937'} !important;
    }

    .toast[data-variant="destructive"] {
      background-color: #dc2626 !important;
      border-color: #dc2626 !important;
      color: white !important;
    }

    .toast[data-variant="default"] {
      background-color: var(--card-bg) !important;
      border-color: ${customization.primary_color || '#e11d48'} !important;
      color: ${customization.text_color || '#1f2937'} !important;
    }

    /* CSS personalizado do usuário */
    ${customization.custom_css || ''}
  `;

  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}

// Função auxiliar para converter hex para HSL
function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '0 0% 0%';
  
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Função auxiliar para escurecer cor
function darkenColor(hex: string, percent: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1)}`;
}
