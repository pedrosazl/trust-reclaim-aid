import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRange } from "@/components/analytics/AnalyticsSection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";

interface StockRevertedTableProps {
  isAdmin: boolean;
  userId: string;
  dateRange: DateRange;
}

export const StockRevertedTable = ({ isAdmin, userId, dateRange }: StockRevertedTableProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [isAdmin, userId, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("exchange_products")
        .select(`
          *,
          products (
            name,
            sku,
            category
          ),
          exchanges!inner (
            created_at,
            user_id,
            cnpj
          )
        `)
        .gte("exchanges.created_at", dateRange.from.toISOString())
        .lte("exchanges.created_at", dateRange.to.toISOString())
        .order("exchanges.created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("exchanges.user_id", userId);
      }

      const { data: products, error } = await query;
      if (error) throw error;

      setData(products || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      returned_to_stock: { label: "No Estoque", variant: "default" },
      discarded: { label: "Descartado", variant: "destructive" },
      analyzing: { label: "Analisando", variant: "secondary" },
      pending: { label: "Pendente", variant: "outline" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      reusable: { label: "Reutilizável", variant: "default" },
      damaged: { label: "Avariado", variant: "destructive" },
      expired: { label: "Vencido", variant: "destructive" },
      analyzing: { label: "Analisando", variant: "secondary" },
    };
    const config = variants[condition] || { label: condition, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.product_status === statusFilter;
    const matchesCondition = conditionFilter === "all" || item.product_condition === conditionFilter;
    const matchesSearch =
      searchTerm === "" ||
      item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exchanges?.cnpj?.includes(searchTerm);
    return matchesStatus && matchesCondition && matchesSearch;
  });

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
    <Card>
      <CardHeader>
        <CardTitle>Produtos Devolvidos</CardTitle>
        <CardDescription>Rastreamento detalhado por SKU e status</CardDescription>
        <div className="flex gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto, SKU ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="returned_to_stock">No Estoque</SelectItem>
              <SelectItem value="discarded">Descartado</SelectItem>
              <SelectItem value="analyzing">Analisando</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Condições</SelectItem>
              <SelectItem value="reusable">Reutilizável</SelectItem>
              <SelectItem value="damaged">Avariado</SelectItem>
              <SelectItem value="expired">Vencido</SelectItem>
              <SelectItem value="analyzing">Analisando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>CNPJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.products?.sku || "N/A"}</TableCell>
                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                    <TableCell>{item.products?.category || "-"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>R$ {parseFloat(item.unit_price || 0).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.product_status)}</TableCell>
                    <TableCell>{getConditionBadge(item.product_condition)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(item.exchanges.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.exchanges.cnpj}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
