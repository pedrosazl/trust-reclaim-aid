import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Geolocation } from "@capacitor/geolocation";

export const useUserPresence = (userId: string | undefined) => {
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    let locationInterval: NodeJS.Timeout;

    const updatePresence = async (latitude?: number, longitude?: number) => {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      await supabase
        .from("user_presence")
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString(),
          latitude,
          longitude,
          location_updated_at: latitude ? new Date().toISOString() : null,
          device_info: deviceInfo,
        });
    };

    const updateLocation = async () => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        
        await updatePresence(
          position.coords.latitude,
          position.coords.longitude
        );
      } catch (error) {
        console.error("Error getting location:", error);
        await updatePresence();
      }
    };

    // Initial presence update
    updateLocation();

    // Update location every 30 seconds
    locationInterval = setInterval(updateLocation, 30000);

    // Set up realtime subscription for online users count
    const channel = supabase
      .channel("user-presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        async () => {
          const { count } = await supabase
            .from("user_presence")
            .select("*", { count: "exact", head: true })
            .eq("is_online", true)
            .gte("last_seen", new Date(Date.now() - 60000).toISOString());

          setOnlineUsers(count || 0);
        }
      )
      .subscribe();

    // Initial count
    supabase
      .from("user_presence")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)
      .gte("last_seen", new Date(Date.now() - 60000).toISOString())
      .then(({ count }) => setOnlineUsers(count || 0));

    // Mark as offline on unmount
    return () => {
      clearInterval(locationInterval);
      supabase
        .from("user_presence")
        .update({ is_online: false })
        .eq("user_id", userId)
        .then(() => {});
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { onlineUsers };
};
