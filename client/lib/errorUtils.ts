/**
 * Formata um erro de forma legível para exibição ao usuário
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Para erros do Supabase ou outros objetos de erro
    const errorObj = error as any;
    
    if (errorObj.message) {
      return errorObj.message;
    }
    
    if (errorObj.error) {
      return formatError(errorObj.error);
    }
    
    if (errorObj.code) {
      return `Erro ${errorObj.code}: ${errorObj.details || errorObj.hint || 'Erro desconhecido'}`;
    }
    
    // Como último recurso, converter para JSON
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido';
    }
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return String(error) || 'Erro desconhecido';
}

/**
 * Registra um erro no console de forma padronizada
 */
export function logError(context: string, error: unknown): void {
  console.error(`❌ ${context}:`, error);
  
  // Log adicional para debug se necessário
  if (typeof error === 'object' && error !== null) {
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
  }
}
