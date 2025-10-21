import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from "lucide-react";
import { useUserPresence } from "@/hooks/useUserPresence";

export const OnlineUsers = ({ userId }: { userId: string }) => {
  const { onlineUsers } = useUserPresence(userId);

  return (
    <Card className="bg-gradient-primary border-primary/20 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Usuários Online
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-4xl font-bold">{onlineUsers}</p>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            <MapPin className="mr-1 h-3 w-3" />
            Com GPS
          </Badge>
        </div>
        <p className="text-xs mt-2 opacity-90">
          Usuários ativos nos últimos 60 segundos
        </p>
      </CardContent>
    </Card>
  );
};
