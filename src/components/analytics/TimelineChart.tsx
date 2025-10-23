import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "./AnalyticsSection";

interface TimelineChartProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

export const TimelineChart = ({ isAdmin, userId, dateRange }: TimelineChartProps) => {
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
        .select("created_at, status")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data: exchanges, error } = await query;

      if (error) throw error;

      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

      const timelineData = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayExchanges = exchanges?.filter((e) => {
          const exchangeDate = startOfDay(new Date(e.created_at));
          return exchangeDate.getTime() === dayStart.getTime();
        });

        return {
          date: format(day, "dd/MM", { locale: ptBR }),
          total: dayExchanges?.length || 0,
          aprovadas: dayExchanges?.filter((e) => e.status === "approved").length || 0,
          rejeitadas: dayExchanges?.filter((e) => e.status === "rejected").length || 0,
          pendentes: dayExchanges?.filter((e) => e.status === "pending").length || 0,
        };
      });

      setData(timelineData);
    } catch (error) {
      console.error("Erro ao buscar dados de timeline:", error);
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
          <CardTitle>Linha do Tempo</CardTitle>
          <CardDescription>Evolução das solicitações ao longo do tempo</CardDescription>
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
        <CardTitle>Linha do Tempo</CardTitle>
        <CardDescription>Evolução das solicitações ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
            <Line type="monotone" dataKey="aprovadas" stroke="#22c55e" name="Aprovadas" strokeWidth={2} />
            <Line type="monotone" dataKey="rejeitadas" stroke="#ef4444" name="Rejeitadas" strokeWidth={2} />
            <Line type="monotone" dataKey="pendentes" stroke="#eab308" name="Pendentes" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
