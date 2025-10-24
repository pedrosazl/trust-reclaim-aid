import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessTracking } from "@/hooks/useAccessTracking";
import { Button } from "@/components/ui/button";
import { ExchangeList } from "@/components/dashboard/ExchangeList";
import { OnlineUsers } from "@/components/dashboard/OnlineUsers";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LogOut, Plus, Shield, User, Package, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Track user access
  useAccessTracking(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sistema de Trocas e Devoluções</h1>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isAdmin && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                    <Shield className="mr-1 h-3 w-3" />
                    Administrador
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationBell userId={user.id} />
              <Button onClick={() => navigate("/produtos")}>
                <Package className="mr-2 h-4 w-4" />
                Produtos
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/auditoria")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Auditoria
                </Button>
              )}
              <Button onClick={() => navigate("/nova-troca")}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <OnlineUsers userId={user.id} />
        <AnalyticsSection isAdmin={isAdmin} userId={user.id} />
        <InventoryDashboard isAdmin={isAdmin} userId={user.id} />
        <ExchangeList isAdmin={isAdmin} userId={user.id} />
      </main>
    </div>
  );
};

export default Dashboard;
