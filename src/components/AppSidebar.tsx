import { LayoutDashboard, Package, FileText, LogOut, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  isAdmin: boolean;
  onSignOut: () => void;
}

export function AppSidebar({ isAdmin, onSignOut }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === "collapsed";

  const mainItems = [
    ...(isAdmin ? [{ 
      title: "Painel Geral", 
      url: "/dashboard", 
      icon: LayoutDashboard 
    }] : []),
    { 
      title: "Nova Solicitação", 
      url: "/nova-troca", 
      icon: Plus 
    },
    { 
      title: "Produtos", 
      url: "/produtos", 
      icon: Package 
    },
    ...(isAdmin ? [{ 
      title: "Auditoria", 
      url: "/auditoria", 
      icon: FileText 
    }] : []),
  ];

  return (
    <Sidebar
      collapsible="icon"
    >
      <div className="p-4 border-b">
        <SidebarTrigger className="mb-2" />
        {!collapsed && (
          <h2 className="text-lg font-semibold">Sistema VDL</h2>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={isActive(item.url) ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSignOut}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
