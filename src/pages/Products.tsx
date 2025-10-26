import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProductList } from "@/components/products/ProductList";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Products = () => {
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
            <h1 className="text-xl font-bold">Gerenciar Produtos</h1>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              <ProductList userId={user.id} isAdmin={isAdmin} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Products;
