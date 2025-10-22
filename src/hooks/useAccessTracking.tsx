import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAccessTracking = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const trackAccess = async () => {
      // Get device and location info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      // Try to get location if available
      let latitude = null;
      let longitude = null;

      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log("Location access denied or unavailable");
        }
      }

      // Update user presence with access tracking
      const { error } = await supabase
        .from("user_presence")
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString(),
          device_info: deviceInfo,
          latitude,
          longitude,
          location_updated_at: latitude ? new Date().toISOString() : null,
        });

      if (error) {
        console.error("Error tracking access:", error);
      }
    };

    // Track on mount
    trackAccess();

    // Track periodically every 5 minutes
    const interval = setInterval(trackAccess, 5 * 60 * 1000);

    // Mark as offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from("user_presence")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .then();
    };
  }, [userId]);
};
