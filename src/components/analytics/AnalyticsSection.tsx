import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusChart } from "./StatusChart";
import { ProductsChart } from "./ProductsChart";
import { TimelineChart } from "./TimelineChart";
import { ReasonsChart } from "./ReasonsChart";
import { StatsCards } from "./StatsCards";
import { DateRangePicker } from "./DateRangePicker";
import { BarChart3 } from "lucide-react";

interface AnalyticsSectionProps {
  isAdmin: boolean;
  userId: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export const AnalyticsSection = ({ isAdmin, userId }: AnalyticsSectionProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatórios e Análises
              </CardTitle>
              <CardDescription>
                Visualize métricas e tendências das devoluções
              </CardDescription>
            </div>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>
        </CardHeader>
      </Card>

      <StatsCards isAdmin={isAdmin} userId={userId} dateRange={dateRange} />

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="timeline">Período</TabsTrigger>
          <TabsTrigger value="reasons">Motivos</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <StatusChart isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsChart isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineChart isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="reasons">
          <ReasonsChart isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
