import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { DateRange } from "@/components/analytics/AnalyticsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialLossChartProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export const FinancialLossChart = ({ isAdmin, userId, dateRange }: FinancialLossChartProps) => {
  const [data, setData] = useState<any>({
    byCategory: [],
    byType: [],
    timeline: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [isAdmin, userId, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get loss data by category
      let categoryQuery = supabase
        .from("exchange_products")
        .select(`
          unit_price,
          quantity,
          products (
            category
          ),
          exchanges!inner (
            created_at,
            user_id,
            shipping_cost,
            processing_fee
          )
        `)
        .gte("exchanges.created_at", dateRange.from.toISOString())
        .lte("exchanges.created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        categoryQuery = categoryQuery.eq("exchanges.user_id", userId);
      }

      const { data: categoryData, error: categoryError } = await categoryQuery;
      if (categoryError) throw categoryError;

      // Group by category
      const categoryLoss: Record<string, number> = {};
      categoryData?.forEach((item: any) => {
        const category = item.products?.category || "Sem Categoria";
        const productLoss = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
        categoryLoss[category] = (categoryLoss[category] || 0) + productLoss;
      });

      const categoryChartData = Object.entries(categoryLoss)
        .map(([name, value]) => ({
          categoria: name,
          perda: value,
        }))
        .sort((a, b) => b.perda - a.perda);

      // Loss by type (product value vs shipping/fees)
      const totalProductLoss = categoryData?.reduce(
        (sum, item: any) => sum + (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0),
        0
      ) || 0;

      const totalShippingCost = categoryData?.reduce(
        (sum, item: any) => sum + (parseFloat(item.exchanges.shipping_cost) || 0),
        0
      ) || 0;

      const totalProcessingFee = categoryData?.reduce(
        (sum, item: any) => sum + (parseFloat(item.exchanges.processing_fee) || 0),
        0
      ) || 0;

      const typeChartData = [
        { name: "Valor dos Produtos", value: totalProductLoss },
        { name: "Frete", value: totalShippingCost },
        { name: "Taxas de Processamento", value: totalProcessingFee },
      ].filter((item) => item.value > 0);

      setData({
        byCategory: categoryChartData,
        byType: typeChartData,
        timeline: [],
      });
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
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

  return (
    <Tabs defaultValue="category" className="space-y-4">
      <TabsList>
        <TabsTrigger value="category">Por Categoria</TabsTrigger>
        <TabsTrigger value="type">Por Tipo</TabsTrigger>
      </TabsList>

      <TabsContent value="category">
        <Card>
          <CardHeader>
            <CardTitle>Perdas por Categoria de Produto</CardTitle>
            <CardDescription>Distribuição das perdas financeiras por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend />
                  <Bar dataKey="perda" fill="#ef4444" name="Perda (R$)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="type">
        <Card>
          <CardHeader>
            <CardTitle>Composição das Perdas</CardTitle>
            <CardDescription>Distribuição entre valor de produtos, frete e taxas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byType.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data.byType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.byType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
