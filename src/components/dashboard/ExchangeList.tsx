import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExchangeProduct {
  id: string;
  quantity: number;
  products: {
    name: string;
    unit: string;
  };
}

interface Exchange {
  id: string;
  cnpj: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  signature_url: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  exchange_products?: ExchangeProduct[];
}

export const ExchangeList = ({ isAdmin, userId }: { isAdmin: boolean; userId: string }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchExchanges();
    
    // Set up realtime subscription
    const channel = supabase
      .channel("exchanges-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exchanges",
        },
        () => {
          fetchExchanges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, userId]);

  const fetchExchanges = async () => {
    setLoading(true);
    let query = supabase
      .from("exchanges")
      .select(`
        *,
        exchange_products(
          id,
          quantity,
          products(name, unit)
        )
      `)
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", userId);
    }

    const { data: exchangesData, error } = await query;

    if (error) {
      toast.error("Erro ao carregar trocas/devoluções");
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const enrichedExchanges = exchangesData?.map(ex => ({
      ...ex,
      profiles: profilesMap.get(ex.user_id) || null,
    })) || [];

    setExchanges(enrichedExchanges);
    setLoading(false);
  };

  const handleApprove = async (exchangeId: string) => {
    const { error } = await supabase
      .from("exchanges")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", exchangeId);

    if (error) {
      toast.error("Erro ao aprovar solicitação");
      return;
    }

    toast.success("Solicitação aprovada com sucesso!");
    fetchExchanges();
  };

  const handleReject = async (exchangeId: string) => {
    const { error } = await supabase
      .from("exchanges")
      .update({
        status: "rejected",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", exchangeId);

    if (error) {
      toast.error("Erro ao rejeitar solicitação");
      return;
    }

    toast.success("Solicitação rejeitada");
    fetchExchanges();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-pending/10 text-pending border-pending">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-approved/10 text-approved border-approved">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aprovada
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejeitada
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredExchanges = exchanges.filter((exchange) => {
    if (filter === "all") return true;
    return exchange.status === filter;
  });

  const stats = {
    pending: exchanges.filter((e) => e.status === "pending").length,
    approved: exchanges.filter((e) => e.status === "approved").length,
    rejected: exchanges.filter((e) => e.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-pending/5 border-pending/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-pending">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-approved/5 border-approved/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-approved">{stats.approved}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          Todas ({exchanges.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          size="sm"
        >
          Pendentes ({stats.pending})
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
          size="sm"
        >
          Aprovadas ({stats.approved})
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
          size="sm"
        >
          Rejeitadas ({stats.rejected})
        </Button>
      </div>

      {filteredExchanges.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma solicitação encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExchanges.map((exchange) => (
            <Card key={exchange.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      CNPJ: {exchange.cnpj}
                    </CardTitle>
                    {isAdmin && exchange.profiles && (
                      <p className="text-sm text-muted-foreground">
                        Solicitante: {exchange.profiles.full_name || "N/A"} ({exchange.profiles.email || "N/A"})
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(exchange.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(exchange.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Motivo:</p>
                  <p className="text-sm text-muted-foreground">{exchange.reason}</p>
                </div>

                {exchange.exchange_products && exchange.exchange_products.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Produtos:</p>
                    <div className="space-y-1">
                      {exchange.exchange_products.map((ep: ExchangeProduct) => (
                        <div key={ep.id} className="text-sm text-muted-foreground flex justify-between">
                          <span>{ep.products.name}</span>
                          <span className="font-medium">{ep.quantity} {ep.products.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(exchange.signature_url || exchange.image_url) && (
                  <div className="flex gap-2">
                    {exchange.signature_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(exchange.signature_url!, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Assinatura
                      </Button>
                    )}
                    {exchange.image_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(exchange.image_url!, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Imagem
                      </Button>
                    )}
                  </div>
                )}

                {isAdmin && exchange.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(exchange.id)}
                      className="flex-1 bg-approved hover:bg-approved/90"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(exchange.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
