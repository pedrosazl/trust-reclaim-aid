import { supabase } from "@/integrations/supabase/client";

interface CNPJData {
  cnpj: string;
  nome: string;
  endereco: string;
  telefone?: string;
}

export const searchCNPJ = async (cnpj: string): Promise<CNPJData | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-cnpj', {
      body: { cnpj }
    });

    if (error) {
      console.error('Error searching CNPJ:', error);
      return null;
    }

    return data as CNPJData;
  } catch (error) {
    console.error('Error calling search-cnpj function:', error);
    return null;
  }
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, "");
  
  // Validação básica de tamanho
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Aqui você pode adicionar validação de dígitos verificadores se quiser
  return true;
};
