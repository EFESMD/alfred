"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useNotifications() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!session?.user?.id || !pusherClient) return;

    const channelName = `private-user-${session.user.id}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("notification:new", (notification: any) => {
      // Invalidate query to refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Show toast
      toast(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: "View",
          onClick: () => router.push(notification.link),
        } : undefined,
      });
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [session?.user?.id, queryClient, router]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
