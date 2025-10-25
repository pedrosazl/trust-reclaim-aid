// Simulação de API de CNPJ
// No futuro, você pode substituir isso por uma API real como ReceitaWS ou similar

interface CNPJData {
  cnpj: string;
  nome: string;
  endereco: string;
  telefone?: string;
}

const cnpjDatabase: CNPJData[] = [
  { cnpj: "12.345.678/0001-99", nome: "Empresa Alpha", endereco: "Rua A, 100", telefone: "1111-1111" },
  { cnpj: "98.765.432/0001-88", nome: "Empresa Beta", endereco: "Rua B, 200", telefone: "2222-2222" },
  { cnpj: "11.222.333/0001-44", nome: "Mercado Vale Verde", endereco: "Av. Central, 500", telefone: "3333-3333" },
  { cnpj: "44.555.666/0001-77", nome: "Supermercado Bom Preço", endereco: "Rua das Flores, 123", telefone: "4444-4444" },
  { cnpj: "77.888.999/0001-00", nome: "Distribuidora Regional", endereco: "Rod. BR-101, Km 45", telefone: "5555-5555" },
];

export const searchCNPJ = async (cnpj: string): Promise<CNPJData | null> => {
  // Simula um delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Remove formatação para comparação
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  
  // Busca no "banco de dados"
  const found = cnpjDatabase.find(item => 
    item.cnpj.replace(/\D/g, "") === cleanCNPJ
  );
  
  return found || null;
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
