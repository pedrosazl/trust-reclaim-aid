import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuditLog } from "@/components/audit/AuditLog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const AuditLogs = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

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
            <div>
              <h1 className="text-xl font-bold">Auditoria do Sistema</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Visualize todas as ações realizadas no sistema"
                  : "Visualize suas ações no sistema"}
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <AuditLog userId={user.id} isAdmin={isAdmin} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AuditLogs;
