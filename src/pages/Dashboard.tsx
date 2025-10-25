import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessTracking } from "@/hooks/useAccessTracking";
import { ExchangeList } from "@/components/dashboard/ExchangeList";
import { OnlineUsers } from "@/components/dashboard/OnlineUsers";
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <AppSidebar isAdmin={isAdmin} onSignOut={handleSignOut} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card shadow-card flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-xl font-bold">Sistema de Trocas e Devoluções</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <NotificationBell userId={user.id} />
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  {isAdmin && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 space-y-6">
              <OnlineUsers userId={user.id} />
              <AnalyticsSection isAdmin={isAdmin} userId={user.id} />
              <InventoryDashboard isAdmin={isAdmin} userId={user.id} />
              <ExchangeList isAdmin={isAdmin} userId={user.id} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
