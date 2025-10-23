import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DateRange } from "./AnalyticsSection";

interface ProductsChartProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

export const ProductsChart = ({ isAdmin, userId, dateRange }: ProductsChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [isAdmin, userId, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("exchanges")
        .select(`
          id,
          created_at,
          exchange_products!inner (
            product_id,
            quantity,
            products!inner (
              name
            )
          )
        `)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data: exchanges, error } = await query;

      if (error) throw error;

      const productCount: Record<string, number> = {};

      exchanges?.forEach((exchange: any) => {
        exchange.exchange_products?.forEach((ep: any) => {
          const productName = ep.products?.name || "Produto Desconhecido";
          productCount[productName] = (productCount[productName] || 0) + 1;
        });
      });

      const chartData = Object.entries(productCount)
        .map(([name, count]) => ({ name, devoluções: count }))
        .sort((a, b) => b.devoluções - a.devoluções)
        .slice(0, 10);

      setData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados de produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos Devolvidos</CardTitle>
          <CardDescription>Produtos com mais solicitações de devolução</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Produtos Devolvidos</CardTitle>
        <CardDescription>Produtos com mais solicitações de devolução</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="devoluções" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
