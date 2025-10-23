import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DateRange } from "./AnalyticsSection";

interface StatusChartProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

const COLORS = {
  pending: "#eab308",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export const StatusChart = ({ isAdmin, userId, dateRange }: StatusChartProps) => {
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
        .select("status")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data: exchanges, error } = await query;

      if (error) throw error;

      const statusCount = exchanges?.reduce((acc: any, exchange) => {
        acc[exchange.status] = (acc[exchange.status] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.keys(statusCount || {}).map((status) => ({
        name: status === "pending" ? "Pendente" : status === "approved" ? "Aprovado" : "Rejeitado",
        value: statusCount[status],
        status,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
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
          <CardTitle>Distribuição por Status</CardTitle>
          <CardDescription>Análise das solicitações por status</CardDescription>
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
        <CardTitle>Distribuição por Status</CardTitle>
        <CardDescription>Análise das solicitações por status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
