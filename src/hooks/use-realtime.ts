import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtime(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !pusherClient) return;

    const channel = pusherClient.subscribe(`project-${projectId}`);

    channel.bind("task-created", () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    });

    channel.bind("task-updated", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", data.id] });
    });

    channel.bind("comment-added", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(`project-${projectId}`);
      }
    };
  }, [projectId, queryClient]);
}
