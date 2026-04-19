"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { AlertTriangle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isPast } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface MaintenanceSettings {
  maintenanceStatus: "INACTIVE" | "WARNING" | "LOCKDOWN";
  maintenanceStartsAt: string | null;
  maintenanceEndsAt: string | null;
}

export function MaintenanceBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);

  // Initial fetch
  const { data: initialSettings } = useQuery<MaintenanceSettings>({
    queryKey: ["global-maintenance-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/maintenance");
      if (!res.ok) return { maintenanceStatus: "INACTIVE", maintenanceStartsAt: null, maintenanceEndsAt: null };
      return res.json();
    },
    refetchInterval: 60000, // Fallback poll every minute
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Handle Redirection Logic
  useEffect(() => {
    if (!settings || session?.user?.isAdmin) return;

    if (settings.maintenanceStatus === "LOCKDOWN" && pathname !== "/maintenance") {
      router.replace("/maintenance");
    }
  }, [settings, session, pathname, router]);

  useEffect(() => {
    if (!pusherClient) return;

    const channel = pusherClient.subscribe("global");
    
    channel.bind("maintenance-update", (data: MaintenanceSettings) => {
      setSettings(data);
      setIsVisible(true);
    });

    return () => {
      if (pusherClient && pusherClient.channel("global")) {
        pusherClient.unsubscribe("global");
      }
    };
  }, []);

  useEffect(() => {
    if (!settings?.maintenanceStartsAt || settings.maintenanceStatus !== "WARNING") {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(settings.maintenanceStartsAt!);
      if (isPast(start)) {
        setTimeLeft("any moment now");
        clearInterval(interval);
      } else {
        setTimeLeft(formatDistanceToNow(start, { addSuffix: false }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  if (!settings || settings.maintenanceStatus === "INACTIVE" || !isVisible) {
    return null;
  }

  const isLockdown = settings.maintenanceStatus === "LOCKDOWN";

  return (
    <div className={cn(
      "w-full py-2 px-4 flex items-center justify-center gap-4 text-sm font-medium transition-all duration-500 animate-in slide-in-from-top",
      isLockdown ? "bg-red-600 text-white" : "bg-amber-500 text-white"
    )}>
      <div className="flex items-center gap-2">
        {isLockdown ? (
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span>
          {isLockdown 
            ? "System is in LOCKDOWN mode. Only administrators can access the app."
            : `Scheduled maintenance starting in ${timeLeft}. Please save your work now.`
          }
        </span>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="hover:bg-white/20 p-1 rounded-full transition-colors ml-4"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
