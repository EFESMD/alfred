"use client";

import { useSearchParams } from "next/navigation";
import { TaskWithAssignee } from "@/types/task";
import { useMemo } from "react";

export type TaskFilterType = "incomplete" | "completed" | "all";

export function useTaskFilter(tasks: TaskWithAssignee[] | undefined) {
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as TaskFilterType) || "incomplete";

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    switch (filter) {
      case "incomplete":
        return tasks.filter((task) => task.status !== "DONE");
      case "completed":
        return tasks.filter((task) => task.status === "DONE");
      case "all":
        return tasks;
      default:
        return tasks.filter((task) => task.status !== "DONE");
    }
  }, [tasks, filter]);

  return {
    filteredTasks,
    filter,
  };
}
