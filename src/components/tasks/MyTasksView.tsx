"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Calendar, User, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isBefore, startOfDay } from "date-fns";
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
import { useState, useMemo } from "react";
import { TaskStatus, TaskPriority } from "@/types/task";
import { cn, formatStatus } from "@/lib/utils";
import { useTaskFilter } from "@/hooks/use-task-filter";
import { ProjectFilter } from "../projects/ProjectFilter";
import * as React from "react";

interface MyTasksViewProps {
  workspaceId: string;
}

export function MyTasksView({ workspaceId }: MyTasksViewProps) {
  const [selectedTask, setSelectedTask] = useState<{ id: string; projectId: string; isArchived: boolean } | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  const { data: tasks, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["my-tasks", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/my-tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { filteredTasks } = useTaskFilter(tasks);

  const groupedTasks = useMemo(() => {
    if (!filteredTasks) return {};
    return filteredTasks.reduce((groups: Record<string, any[]>, task) => {
      const projectId = task.projectId;
      if (!groups[projectId]) {
        groups[projectId] = [];
      }
      groups[projectId].push(task);
      return groups;
    }, {});
  }, [filteredTasks]);

  const toggleProject = (projectId: string) => {
    setCollapsedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "BACKLOG": return "bg-slate-500";
      case "TODO": return "bg-blue-600";
      case "IN_PROGRESS": return "bg-amber-500";
      case "DONE": return "bg-emerald-600";
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading your tasks...</div>;

  const projects = Object.keys(groupedTasks);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">All tasks assigned to you in this workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFilter />
        </div>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Task name</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map((projectId) => {
                const projectTasks = groupedTasks[projectId];
                const project = projectTasks[0]?.project;
                const isCollapsed = collapsedProjects[projectId];

                return (
                  <React.Fragment key={projectId}>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-100 group">
                      <TableCell colSpan={5} className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleProject(projectId)}
                            className="hover:bg-slate-200 p-0.5 rounded transition-colors"
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <div 
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-[10px] shadow-xs border",
                              project?.color || "bg-blue-500 text-white"
                            )}
                          >
                            {project?.icon || <FolderOpen className="h-3 w-3" />}
                          </div>
                          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                            {project?.name || "No Project"}
                          </span>
                          <span className="ml-2 font-normal lowercase opacity-50">({projectTasks.length})</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {!isCollapsed && projectTasks.map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer group h-9"
                        onClick={() => setSelectedTask({ 
                          id: task.id, 
                          projectId: task.projectId,
                          isArchived: task.project?.isArchived || false
                        })}
                      >
                        <TableCell className="font-medium pl-10 py-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{task.title}</span>
                            {task.subtasks?.length > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1 h-3.5 gap-1 opacity-50 font-normal">
                                {task.subtasks.length} subtasks
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1">
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs",
                            task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date())) && task.status !== "DONE"
                              ? "text-red-500 font-medium"
                              : task.dueDate 
                                ? "text-foreground" 
                                : "text-muted-foreground"
                          )}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1">
                          <Badge variant="outline" className={cn("text-[10px] py-0 h-5", getPriorityColor(task.priority as TaskPriority))}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1">
                          <Badge className={cn("text-[10px] py-0 h-5", getStatusColor(task.status as TaskStatus))}>
                            {formatStatus(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-1">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
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
        isArchived={selectedTask?.isArchived}
      />
    </div>
  );
}
