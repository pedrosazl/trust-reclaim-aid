import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

const getActionColor = (action: string) => {
  switch (action.toUpperCase()) {
    case "CREATE":
      return "bg-approved/10 text-approved border-approved";
    case "UPDATE":
      return "bg-pending/10 text-pending border-pending";
    case "DELETE":
      return "bg-destructive/10 text-destructive border-destructive";
    default:
      return "";
  }
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "product":
      return <Package className="h-4 w-4" />;
    case "exchange":
      return <FileText className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export const AuditLog = ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("audit-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!isAdmin) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar logs de auditoria");
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Log de Auditoria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Todas as ações do sistema"
            : "Suas ações no sistema"}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma ação registrada
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="mt-1">{getEntityIcon(log.entity_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={getActionColor(log.action)}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {log.entity_type}
                      </span>
                    </div>
                    {isAdmin && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.user_name || log.user_email || "Sistema"}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
