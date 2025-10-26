import { NavLink, useLocation } from "react-router-dom";
import { FileText, BarChart3, Package, Users, LayoutDashboard, ScrollText, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Nova Solicitação", url: "/", icon: FileText },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Auditoria", url: "/auditoria", icon: ScrollText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    // Fecha o sidebar em dispositivos móveis após clicar
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <SidebarGroup>
          <SidebarGroupLabel className="text-black font-bold text-base">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && <span className="text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
