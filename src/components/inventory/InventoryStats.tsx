import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Trash2, Search, RotateCcw, DollarSign, TrendingDown } from "lucide-react";
import { DateRange } from "@/components/analytics/AnalyticsSection";

interface InventoryStatsProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

interface Stats {
  returnedToStock: number;
  discarded: number;
  analyzing: number;
  totalLoss: number;
  productValueLoss: number;
  shippingCostTotal: number;
}

export const InventoryStats = ({ isAdmin, userId, dateRange }: InventoryStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    returnedToStock: 0,
    discarded: 0,
    analyzing: 0,
    totalLoss: 0,
    productValueLoss: 0,
    shippingCostTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [isAdmin, userId, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get exchange products status counts
      let productQuery = supabase
        .from("exchange_products")
        .select(`
          product_status,
          exchanges!inner (
            created_at,
            user_id
          )
        `)
        .gte("exchanges.created_at", dateRange.from.toISOString())
        .lte("exchanges.created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        productQuery = productQuery.eq("exchanges.user_id", userId);
      }

      const { data: productData, error: productError } = await productQuery;
      if (productError) throw productError;

      const returnedToStock = productData?.filter((p: any) => p.product_status === "returned_to_stock").length || 0;
      const discarded = productData?.filter((p: any) => p.product_status === "discarded").length || 0;
      const analyzing = productData?.filter((p: any) => p.product_status === "analyzing").length || 0;

      // Get financial data
      let financeQuery = supabase
        .from("exchanges")
        .select("shipping_cost, processing_fee, total_loss")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        financeQuery = financeQuery.eq("user_id", userId);
      }

      const { data: financeData, error: financeError } = await financeQuery;
      if (financeError) throw financeError;

      const shippingCostTotal = financeData?.reduce((sum, e) => sum + (Number(e.shipping_cost) || 0), 0) || 0;
      const totalLoss = financeData?.reduce((sum, e) => sum + (Number(e.total_loss) || 0), 0) || 0;

      // Get product value loss
      let productValueQuery = supabase
        .from("exchange_products")
        .select(`
          unit_price,
          quantity,
          exchanges!inner (
            created_at,
            user_id
          )
        `)
        .gte("exchanges.created_at", dateRange.from.toISOString())
        .lte("exchanges.created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        productValueQuery = productValueQuery.eq("exchanges.user_id", userId);
      }

      const { data: valueData, error: valueError } = await productValueQuery;
      if (valueError) throw valueError;

      const productValueLoss = valueData?.reduce(
        (sum, p: any) => sum + (parseFloat(p.unit_price) || 0) * (parseFloat(p.quantity) || 0),
        0
      ) || 0;

      setStats({
        returnedToStock,
        discarded,
        analyzing,
        totalLoss,
        productValueLoss,
        shippingCostTotal,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas de estoque:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Retornados ao Estoque",
      value: stats.returnedToStock,
      icon: RotateCcw,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Descartados",
      value: stats.discarded,
      icon: Trash2,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Em Análise",
      value: stats.analyzing,
      icon: Search,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Perda Total",
      value: `R$ ${(Number(stats.totalLoss) + Number(stats.productValueLoss)).toFixed(2)}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Valor em Produtos",
      value: `R$ ${Number(stats.productValueLoss).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Custos de Frete",
      value: `R$ ${Number(stats.shippingCostTotal).toFixed(2)}`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
