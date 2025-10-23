import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { InventoryStats } from "./InventoryStats";
import { StockRevertedTable } from "./StockRevertedTable";
import { FinancialLossChart } from "./FinancialLossChart";
import { DateRange } from "@/components/analytics/AnalyticsSection";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";

interface InventoryDashboardProps {
  isAdmin: boolean;
  userId: string;
}

export const InventoryDashboard = ({ isAdmin, userId }: InventoryDashboardProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Controle de Estoque e Perdas Financeiras
              </CardTitle>
              <CardDescription>
                Rastreamento detalhado de produtos devolvidos e impacto financeiro
              </CardDescription>
            </div>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>
        </CardHeader>
      </Card>

      <InventoryStats isAdmin={isAdmin} userId={userId} dateRange={dateRange} />

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">Estoque Revertido</TabsTrigger>
          <TabsTrigger value="financial">Perdas Financeiras</TabsTrigger>
          <TabsTrigger value="analysis">Análise Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockRevertedTable isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialLossChart isAdmin={isAdmin} userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada por Produto</CardTitle>
              <CardDescription>Em desenvolvimento - análise aprofundada de perdas por SKU</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
