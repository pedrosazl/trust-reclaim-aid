import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AlertsButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkAlerts = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("check-alerts");

      if (error) throw error;

      toast({
        title: "Alertas verificados",
        description: "Sistema de alertas atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error checking alerts:", error);
      toast({
        title: "Erro ao verificar alertas",
        description: "Não foi possível atualizar os alertas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={checkAlerts}
      disabled={loading}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Verificar Alertas
    </Button>
  );
};
