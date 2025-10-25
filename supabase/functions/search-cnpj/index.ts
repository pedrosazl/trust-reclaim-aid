import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();
    
    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove formatação do CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    console.log(`Searching CNPJ: ${cleanCNPJ}`);

    // Chama a BrasilAPI para buscar dados do CNPJ
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CNPJ não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`BrasilAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Formata os dados no padrão esperado
    const formattedData = {
      cnpj: data.cnpj,
      nome: data.razao_social || data.nome_fantasia || '',
      endereco: [
        data.descricao_tipo_de_logradouro || '',
        data.logradouro || '',
        data.numero || '',
        data.complemento || '',
        data.bairro || '',
        data.municipio || '',
        data.uf || '',
        data.cep || ''
      ].filter(Boolean).join(', '),
      telefone: data.ddd_telefone_1 || ''
    };

    console.log(`CNPJ found: ${formattedData.nome}`);

    return new Response(
      JSON.stringify(formattedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching CNPJ:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search CNPJ';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
