import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Volume2, VolumeX } from "lucide-react";

export default function Settings() {
  const [approvedSound, setApprovedSound] = useState(true);
  const [rejectedSound, setRejectedSound] = useState(true);

  useEffect(() => {
    const savedApproved = localStorage.getItem("notification_approved_sound");
    const savedRejected = localStorage.getItem("notification_rejected_sound");
    
    if (savedApproved !== null) setApprovedSound(savedApproved === "true");
    if (savedRejected !== null) setRejectedSound(savedRejected === "true");
  }, []);

  const handleApprovedChange = (checked: boolean) => {
    setApprovedSound(checked);
    localStorage.setItem("notification_approved_sound", String(checked));
    toast.success(checked ? "Som de aprovação ativado" : "Som de aprovação desativado");
  };

  const handleRejectedChange = (checked: boolean) => {
    setRejectedSound(checked);
    localStorage.setItem("notification_rejected_sound", String(checked));
    toast.success(checked ? "Som de rejeição ativado" : "Som de rejeição desativado");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure as preferências do aplicativo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Notificações Sonoras
          </CardTitle>
          <CardDescription>
            Configure os sons de notificação para aprovações e rejeições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="approved-sound" className="text-base font-medium">
                Som de Aprovação
              </Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som quando uma solicitação for aprovada
              </p>
            </div>
            <Switch
              id="approved-sound"
              checked={approvedSound}
              onCheckedChange={handleApprovedChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="rejected-sound" className="text-base font-medium">
                Som de Rejeição
              </Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som quando uma solicitação for rejeitada
              </p>
            </div>
            <Switch
              id="rejected-sound"
              checked={rejectedSound}
              onCheckedChange={handleRejectedChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
