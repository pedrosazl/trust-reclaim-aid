import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Download, FileText, TrendingUp, Package, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Reports = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && user && !isAdmin) {
      navigate("/");
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar relatórios"
      });
    }
  }, [user, loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const generatePDFReport = async () => {
    setGenerating(true);
    try {
      // Buscar dados para o relatório
      const { data: exchanges } = await supabase
        .from("exchanges")
        .select(`
          *,
          exchange_products (
            *,
            products (*)
          )
        `)
        .order("created_at", { ascending: false });

      // Criar conteúdo HTML do relatório
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Trocas e Devoluções</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #4a9d5f; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4a9d5f; color: white; }
            .summary { background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>RELATÓRIO DE TROCAS E DEVOLUÇÕES</h1>
          <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          
          <div class="summary">
            <h2>Resumo</h2>
            <p><strong>Total de Solicitações:</strong> ${exchanges?.length || 0}</p>
            <p><strong>Pendentes:</strong> ${exchanges?.filter(e => e.status === 'pending').length || 0}</p>
            <p><strong>Aprovadas:</strong> ${exchanges?.filter(e => e.status === 'approved').length || 0}</p>
            <p><strong>Rejeitadas:</strong> ${exchanges?.filter(e => e.status === 'rejected').length || 0}</p>
          </div>

          <h2>Detalhamento das Solicitações</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>CNPJ</th>
                <th>Status</th>
                <th>Motivo</th>
                <th>Produtos</th>
              </tr>
            </thead>
            <tbody>
              ${exchanges?.map(exchange => `
                <tr>
                  <td>${new Date(exchange.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>${exchange.cnpj}</td>
                  <td>${exchange.status}</td>
                  <td>${exchange.reason}</td>
                  <td>${exchange.exchange_products?.length || 0} item(s)</td>
                </tr>
              `).join('') || '<tr><td colspan="5">Nenhum registro encontrado</td></tr>'}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Criar blob e baixar
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-trocas-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <AppSidebar isAdmin={isAdmin} onSignOut={handleSignOut} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card shadow-card flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-bold">Relatórios</h1>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatório de Trocas e Devoluções
                  </CardTitle>
                  <CardDescription>
                    Gere um relatório completo com todas as solicitações de trocas e devoluções
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Resumo Estatístico</p>
                      <p className="text-xs">Total de solicitações por status</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <Package className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Produtos</p>
                      <p className="text-xs">Detalhamento de produtos trocados</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <Users className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Clientes</p>
                      <p className="text-xs">Informações por CNPJ</p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={generatePDFReport}
                    disabled={generating}
                    className="w-full md:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Gerando..." : "Baixar Relatório (HTML)"}
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4">
                    O relatório será baixado em formato HTML. Você pode abri-lo em qualquer navegador e depois salvá-lo como PDF usando a função de impressão do navegador.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
