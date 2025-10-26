import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import valeDoLeiteLogo from "@/assets/valedoleite_logo.png";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header com nome do usuário */}
      <header className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-end items-center">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.email}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Logo centralizada */}
          <div className="flex flex-col items-center space-y-6">
            <img 
              src={valeDoLeiteLogo} 
              alt="Vale do Leite" 
              className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-lg"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">
              SISTEMA VALE DO LEITE
            </h1>
          </div>

          {/* Botão Nova Solicitação */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/nova-troca")}
              className="text-lg px-12 py-6 h-auto shadow-elevated hover:shadow-elevated transition-all"
            >
              <Plus className="mr-2 h-6 w-6" />
              Nova Solicitação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
