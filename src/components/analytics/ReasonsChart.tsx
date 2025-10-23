import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { DateRange } from "./AnalyticsSection";

interface ReasonsChartProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#6366f1"];

export const ReasonsChart = ({ isAdmin, userId, dateRange }: ReasonsChartProps) => {
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
        .select("reason")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data: exchanges, error } = await query;

      if (error) throw error;

      // Categorize reasons by keywords
      const reasonCategories: Record<string, number> = {
        "Produto vencido": 0,
        "Produto danificado": 0,
        "Troca": 0,
        "Devolução": 0,
        "Defeito": 0,
        "Erro no pedido": 0,
        "Não solicitado": 0,
        "Outros": 0,
      };

      exchanges?.forEach((exchange) => {
        const reason = exchange.reason?.toLowerCase() || "";
        if (reason.includes("vencido") || reason.includes("validade")) {
          reasonCategories["Produto vencido"]++;
        } else if (reason.includes("danificado") || reason.includes("avaria") || reason.includes("quebrado")) {
          reasonCategories["Produto danificado"]++;
        } else if (reason.includes("troca")) {
          reasonCategories["Troca"]++;
        } else if (reason.includes("devolução") || reason.includes("devolver")) {
          reasonCategories["Devolução"]++;
        } else if (reason.includes("defeito") || reason.includes("com problema")) {
          reasonCategories["Defeito"]++;
        } else if (reason.includes("erro") || reason.includes("errado")) {
          reasonCategories["Erro no pedido"]++;
        } else if (reason.includes("não solicitado") || reason.includes("não pedi")) {
          reasonCategories["Não solicitado"]++;
        } else {
          reasonCategories["Outros"]++;
        }
      });

      const chartData = Object.entries(reasonCategories)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({
          motivo: category,
          quantidade: count,
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      setData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados de motivos:", error);
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
          <CardTitle>Principais Motivos</CardTitle>
          <CardDescription>Categorização dos motivos de devolução</CardDescription>
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
        <CardTitle>Principais Motivos</CardTitle>
        <CardDescription>Categorização dos motivos de devolução</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="motivo" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantidade" name="Quantidade">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
