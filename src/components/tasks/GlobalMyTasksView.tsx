"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Calendar, User, FolderOpen, ChevronDown, ChevronRight, Layout as LayoutIcon } from "lucide-react";
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

interface GlobalTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  projectId: string;
  sectionId: string | null;
  assigneeId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    isArchived: boolean;
    workspaceId: string;
    workspace: {
      id: string;
      name: string;
    };
  };
  assignee?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  subtasks: { id: string }[];
}

export function GlobalMyTasksView() {
  const [selectedTask, setSelectedTask] = useState<{ id: string; projectId: string; workspaceId: string; isArchived: boolean } | null>(null);
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({});

  const { data: tasks, isLoading } = useQuery<GlobalTask[]>({
    queryKey: ["global-my-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/my-tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      // Ensure dates are correctly parsed
      return data.map((task: any) => ({
        ...task,
        startDate: task.startDate ? new Date(task.startDate) : null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    },
  });

  const { filteredTasks } = useTaskFilter(tasks as any);

  const groupedTasks = useMemo(() => {
    if (!filteredTasks) return {};
    
    // Group by Workspace -> then by Project
    return (filteredTasks as unknown as GlobalTask[]).reduce((groups: any, task) => {
      const workspaceId = task.project.workspace.id;
      const workspaceName = task.project.workspace.name;
      const projectId = task.projectId;
      const projectName = task.project.name;

      if (!groups[workspaceId]) {
        groups[workspaceId] = {
          name: workspaceName,
          projects: {}
        };
      }

      if (!groups[workspaceId].projects[projectId]) {
        groups[workspaceId].projects[projectId] = {
          name: projectName,
          color: task.project.color,
          icon: task.project.icon,
          isArchived: task.project.isArchived,
          tasks: []
        };
      }

      groups[workspaceId].projects[projectId].tasks.push(task);
      return groups;
    }, {});
  }, [filteredTasks]);

  const toggleWorkspace = (workspaceId: string) => {
    setCollapsedWorkspaces(prev => ({ ...prev, [workspaceId]: !prev[workspaceId] }));
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading all your tasks...</div>;

  const workspaceIds = Object.keys(groupedTasks);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All My Tasks</h1>
          <p className="text-sm text-muted-foreground">Every task assigned to you across all your workspaces.</p>
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
              <TableHead>Workspace / Project</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaceIds.length > 0 ? (
              workspaceIds.map((workspaceId) => {
                const workspace = groupedTasks[workspaceId];
                const isCollapsed = collapsedWorkspaces[workspaceId];
                const projectIds = Object.keys(workspace.projects);

                return (
                  <React.Fragment key={workspaceId}>
                    {/* Workspace Header Row */}
                    <TableRow className="bg-slate-100 hover:bg-slate-100 font-bold">
                      <TableCell colSpan={6} className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleWorkspace(workspaceId)}
                            className="hover:bg-slate-200 p-0.5 rounded transition-colors"
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <LayoutIcon className="h-4 w-4 text-primary" />
                          <span className="uppercase tracking-widest text-[11px]">
                            Workspace: {workspace.name}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {!isCollapsed && projectIds.map((projectId) => {
                      const project = workspace.projects[projectId];
                      return (
                        <React.Fragment key={projectId}>
                          {/* Project Sub-header Row */}
                          <TableRow className="bg-slate-50/50 hover:bg-slate-100 group">
                            <TableCell colSpan={6} className="py-2 px-6">
                              <div className="flex items-center gap-2">
                                <div 
                                  className={cn(
                                    "w-4 h-4 rounded flex items-center justify-center text-[8px] shadow-xs border",
                                    project.color || "bg-blue-500 text-white"
                                  )}
                                >
                                  {project.icon || <FolderOpen className="h-2.5 w-2.5" />}
                                </div>
                                <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {project.name}
                                </span>
                                <span className="ml-2 font-normal lowercase opacity-50 text-[10px]">({project.tasks.length})</span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Tasks for this project */}
                          {project.tasks.map((task: GlobalTask) => (
                            <TableRow 
                              key={task.id} 
                              className="cursor-pointer group h-9"
                              onClick={() => setSelectedTask({ 
                                id: task.id, 
                                projectId: task.projectId,
                                workspaceId: task.project.workspaceId,
                                isArchived: task.project.isArchived
                              })}
                            >
                              <TableCell className="font-medium pl-12 py-1">
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
                                <div className="flex flex-col text-[10px] text-muted-foreground">
                                  <span className="truncate max-w-[150px] font-medium">{workspace.name}</span>
                                  <span className="truncate max-w-[150px] opacity-70">{project.name}</span>
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
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                  You have no tasks assigned across any workspace.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailSheet 
        taskId={selectedTask?.id || null}
        workspaceId={selectedTask?.workspaceId || ""}
        projectId={selectedTask?.projectId || ""}
        onClose={() => setSelectedTask(null)}
        isArchived={selectedTask?.isArchived}
      />
    </div>
  );
}
