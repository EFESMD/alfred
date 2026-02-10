"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Calendar, User, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useState } from "react";
import { TaskStatus, TaskPriority } from "@/types/task";
import { cn } from "@/lib/utils";

interface MyTasksViewProps {
  workspaceId: string;
}

export function MyTasksView({ workspaceId }: MyTasksViewProps) {
  const [selectedTask, setSelectedTask] = useState<{ id: string; projectId: string } | null>(null);

  const { data: tasks, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["my-tasks", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/my-tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "BACKLOG": return "bg-slate-500";
      case "TODO": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-yellow-500";
      case "DONE": return "bg-green-500";
      default: return "bg-slate-500";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW": return "text-blue-500 bg-blue-50";
      case "MEDIUM": return "text-yellow-600 bg-yellow-50";
      case "HIGH": return "text-red-500 bg-red-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading your tasks...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground">All tasks assigned to you in this workspace.</p>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Task name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow 
                key={task.id} 
                className="cursor-pointer"
                onClick={() => setSelectedTask({ id: task.id, projectId: task.projectId })}
              >
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span>{task.project?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    task.dueDate ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-4 w-4" />
                    <span>{task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(task.priority as TaskPriority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(task.status as TaskStatus)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {tasks?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  You have no tasks assigned.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailSheet 
        taskId={selectedTask?.id || null}
        workspaceId={workspaceId}
        projectId={selectedTask?.projectId || ""}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
