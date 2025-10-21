import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileText, CheckCircle } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sistema de Trocas e Devoluções
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie solicitações de trocas e devoluções de forma eficiente e profissional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-lg shadow-card border">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Solicitações Simples</h3>
              <p className="text-sm text-muted-foreground">
                Preencha o formulário com CNPJ, motivo e documentação necessária
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-card border">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aprovação Segura</h3>
              <p className="text-sm text-muted-foreground">
                Sistema de aprovação com controle de acesso administrativo
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-card border">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Modo Offline</h3>
              <p className="text-sm text-muted-foreground">
                Trabalhe sem conexão e sincronize automaticamente quando online
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 shadow-elevated hover:shadow-elevated"
            >
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-16 p-6 bg-card rounded-lg shadow-card border">
            <p className="text-sm text-muted-foreground">
              <strong>Primeiro acesso?</strong> O primeiro usuário cadastrado automaticamente se torna administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
