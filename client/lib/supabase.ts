import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Note: Supabase client for client-side operations (e.g., fetching public data)
// For server-side operations (e.g., Server Actions, Route Handlers),
// use the service role key or a separate client with appropriate authentication.

const metaEnv = (import.meta as any).env;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? metaEnv?.VITE_SUPABASE_URL ?? metaEnv?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? metaEnv?.VITE_SUPABASE_ANON_KEY ?? metaEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.")
}

// Singleton pattern for client-side Supabase client
let _supabase: SupabaseClient | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  }
  return _supabase
}

// Export a named supabase client for convenience (many files expect this named export)
export const supabase = getSupabaseClient()

// Utility to debug supabase errors consistently across the app
export function debugSupabaseError(error: unknown, context?: string) {
  try {
    const ctx = context ? `[${context}]` : "[supabase]"
    console.error(`${ctx} Supabase error:`, error)
    const errObj: any = (error as any) || {}
    if (errObj.message) console.error(`${ctx} message:`, errObj.message)
    if (errObj.code) console.error(`${ctx} code:`, errObj.code)
    if (errObj.details) console.error(`${ctx} details:`, errObj.details)
    if (errObj.hint) console.info(`${ctx} hint:`, errObj.hint)
    if (errObj.requestId) console.info(`${ctx} requestId:`, errObj.requestId)
  } catch (e) {
    console.error("[debugSupabaseError] Failed to log error:", e)
  }
}

// Type definitions for your database schema
export interface Product {
  id: number
  name: string
  price: number
  image: string
  image_2?: string | null
  category: string
  sizes: string[] | null
  colors: string[] | null
  stock: number
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreSettings {
  id: number
  store_name: string
  whatsapp_number?: string | null
  monthly_sales: number
  footer_text?: string | null
  footer_company_name?: string | null
  browser_tab_title?: string | null // New field
  favicon_url?: string | null // New field
  pix_copy_paste?: string | null // New field
  coupon_code_1?: string | null
  coupon_type_1?: "percentage" | "fixed" | null
  coupon_value_1?: number | null
  coupon_expiration_1?: string | null
  coupon_usage_limit_1?: number | null
  coupon_code_2?: string | null
  coupon_type_2?: "percentage" | "fixed" | null
  coupon_value_2?: number | null
  coupon_expiration_2?: string | null
  coupon_usage_limit_2?: number | null
  coupon_code_3?: string | null
  coupon_type_3?: "percentage" | "fixed" | null
  coupon_value_3?: number | null
  coupon_expiration_3?: string | null
  coupon_usage_limit_3?: number | null
  created_at: string
  updated_at: string
}

export interface StoreCustomization {
  id: number
  header_color: string
  menu_color: string
  site_background_color: string
  card_background_color: string
  card_border_color: string
  button_color: string
  button_text_color: string
  cart_color: string
  show_logo: boolean
  logo_url?: string | null
  logo_size: "small" | "medium" | "large"
  show_store_name: boolean
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string // UUID
  username: string
  password_hash: string
  created_at: string
  updated_at: string
}
