"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskWithAssignee, TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "../tasks/TaskDetailSheet";
import { useRealtime } from "@/hooks/use-realtime";
import { useTaskFilter } from "@/hooks/use-task-filter";
import { useSession } from "next-auth/react";

interface CalendarViewProps {
  workspaceId: string;
  projectId: string;
  isArchived?: boolean;
}

export function CalendarView({ workspaceId, projectId, isArchived = false }: CalendarViewProps) {
  useRealtime(projectId);
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const userRole = project?.currentUserRole || "VIEWER";

  const isReadOnly = isArchived || userRole === "VIEWER";

  const { data: tasks, isLoading } = useQuery<TaskWithAssignee[]>({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { filteredTasks } = useTaskFilter(tasks);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "BACKLOG": return "bg-slate-500";
      case "TODO": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-yellow-500";
      case "DONE": return "bg-green-500";
      default: return "bg-slate-500";
    }
  };

  if (isLoading || projectLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading calendar...</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold uppercase tracking-wider">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6 border-b border-r">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-l border-t bg-slate-50/50">
            {day}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          const dayTasks = filteredTasks.filter(task => 
            task.dueDate && isSameDay(new Date(task.dueDate), day)
          );

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[120px] p-2 border-l border-t relative group transition-colors",
                !isSameMonth(day, monthStart) && "bg-slate-50/30 text-muted-foreground",
                isSameDay(day, new Date()) && "bg-blue-50/30"
              )}
            >
              <span className={cn(
                "text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full",
                isSameDay(day, new Date()) && "bg-primary text-primary-foreground shadow-sm"
              )}>
                {format(day, "d")}
              </span>

              <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded truncate cursor-pointer hover:brightness-95 transition-all shadow-sm",
                      getStatusColor(task.status as TaskStatus),
                      "text-white font-medium"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailSheet 
        taskId={selectedTaskId}
        workspaceId={workspaceId}
        projectId={projectId}
        onClose={() => setSelectedTaskId(null)}
        isArchived={isReadOnly}
      />
    </div>
  );
}
