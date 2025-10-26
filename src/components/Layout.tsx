import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const Layout = ({ children, showSidebar = true }: LayoutProps) => {
  const { user, isAdmin, signOut } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {showSidebar && isAdmin && <AppSidebar />}
        
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card shadow-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showSidebar && isAdmin && (
              <SidebarTrigger className="[&>svg]:hidden">
                <Menu className="h-5 w-5 text-foreground" />
              </SidebarTrigger>
            )}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user.email}</span>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded">
                  Admin
                </span>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
