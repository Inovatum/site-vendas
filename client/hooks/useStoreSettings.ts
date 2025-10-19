"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; // Assuming supabase client is correctly imported
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is available

export interface StoreSettings {
  id: number;
  store_name: string;
  whatsapp_number: string;
  monthly_sales: number;
  footer_text: string | null;
  footer_company_name: string | null;
  browser_tab_title: string;
  favicon_url: string | null;
  pix_copy_paste: string | null; // NOVO CAMPO
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsUpdate {
  store_name?: string;
  whatsapp_number?: string;
  footer_text?: string | null;
  footer_company_name?: string | null;
  browser_tab_title?: string;
  favicon_url?: string | null;
  pix_copy_paste?: string | null; // NOVO CAMPO
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "DEBUG: supabaseUrl present?",
        (await import("@/lib/supabase")).supabaseUrl ? true : false,
      );
      console.log(
        "DEBUG: supabaseAnonKey present?",
        (await import("@/lib/supabase")).supabaseAnonKey ? true : false,
      );

      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        // If table doesn't exist or no data, create default settings
        if (error.code === "PGRST116" || error.code === "42P01") {
          // 42P01 is "undefined_table"
          console.log("Creating default store settings...");
          await createDefaultSettings();
          return;
        }
        throw error;
      }
      setSettings(data);
      console.log("⚙️ Configurações da loja carregadas:", data); // Adicione esta linha
    } catch (err: any) {
      console.error("Erro ao buscar configurações da loja:", err.message);
      let errorMessage = "Erro ao carregar configurações";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = (err as any).message;
      } else {
        errorMessage = String(err);
      }
      setError(errorMessage);
      setSettings(null);
      toast({
        title: "Erro de Carregamento",
        description: "Não foi possível carregar as configurações da loja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create default settings
  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        store_name: "Minha Loja",
        whatsapp_number: "5511999999999",
        monthly_sales: 0,
        footer_text: "© 2024 Minha Loja. Todos os direitos reservados.",
        footer_company_name: "Minha Loja",
        browser_tab_title: "Minha Loja Online",
        favicon_url: "/placeholder.svg?height=32&width=32",
        pix_copy_paste: null, // Default para o novo campo
      };
      const { data, error } = await supabase
        .from("store_settings")
        .insert([defaultSettings])
        .select()
        .single();
      if (error) throw error;
      setSettings(data);
      toast({
        title: "Configurações Padrão Criadas",
        description: "Configurações padrão da loja foram criadas com sucesso.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Erro ao criar configurações padrão:", err.message);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao criar configurações";
      setError(errorMessage);
      toast({
        title: "Erro ao Criar Configurações",
        description: "Não foi possível criar as configurações padrão da loja.",
        variant: "destructive",
      });
    }
  };

  // Update settings
  const updateSettings = useCallback(
    async (updates: StoreSettingsUpdate): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        if (!settings) {
          console.warn("No settings available to update");
          setError("Nenhuma configuração disponível para atualizar.");
          return false;
        }
        const { data, error } = await supabase
          .from("store_settings")
          .update(updates)
          .eq("id", settings.id)
          .select()
          .single();

        if (error) {
          throw error;
        }
        setSettings(data);
        toast({
          title: "Configurações Salvas",
          description:
            "As configurações da loja foram atualizadas com sucesso.",
          variant: "default",
        });
        return true;
      } catch (err: any) {
        console.error("Erro ao atualizar configurações da loja:", err.message);
        setError("Erro ao salvar configurações da loja.");
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar as configurações da loja.",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [settings, toast], // Added settings to dependencies
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    clearError: () => setError(null),
  };
}
