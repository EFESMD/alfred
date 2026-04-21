"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { List, LayoutGrid, Calendar as CalendarIcon, GanttChart, User, Settings, Archive, Eye, Star, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ProjectFilter } from "./ProjectFilter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectStatusBadge, statusConfig, ProjectStatus } from "./ProjectStatusBadge";
import { Sparkles } from "lucide-react";
import { TaskExtractionModal } from "./TaskExtractionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectHeaderProps {
  workspaceId: string;
  projectId: string;
  projectName: string;
  projectLeader?: {
    name: string | null;
    image: string | null;
  } | null;
  status?: string;
  isArchived?: boolean;
  userRole?: string;
  initialIsFavorite?: boolean;
}

export function ProjectHeader({ 
  workspaceId, 
  projectId, 
  projectName, 
  projectLeader,
  status = "ON_TRACK",
  isArchived = false,
  userRole = "MEMBER",
  initialIsFavorite = false
}: ProjectHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);

  const { data: healthData, isLoading: isHealthLoading, isFetching: isHealthFetching, refetch: refetchHealth } = useQuery({
    queryKey: ["project-health", projectId],
    queryFn: async ({ queryKey }) => {
      const isManualRefresh = queryKey[2] === true;
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/ai-health${isManualRefresh ? "?refresh=true" : ""}`);
      if (!res.ok) throw new Error("Failed to fetch health pulse");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const handleRefreshPulse = () => {
    queryClient.fetchQuery({
      queryKey: ["project-health", projectId, true],
      queryFn: async () => {
        const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/ai-health?refresh=true`);
        if (!res.ok) throw new Error("Failed to fetch health pulse");
        const data = await res.json();
        // Update the main query cache
        queryClient.setQueryData(["project-health", projectId], data);
        return data;
      }
    });
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/favorite`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update favorite status");
      return res.json();
    },
    onSuccess: (data) => {
      setIsFavorite(data.isFavorite);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(data.isFavorite ? "Project added to favorites" : "Project removed from favorites");
    },
    onError: () => {
      toast.error("Something went wrong");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update project status");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentStatus(data.status);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Project status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });

  const isKanban = pathname.endsWith("/kanban");
  const isCalendar = pathname.endsWith("/calendar");
  const isTimeline = pathname.endsWith("/timeline");
  const isSettings = pathname.endsWith("/settings");
  const isList = !isKanban && !isCalendar && !isTimeline && !isSettings;

  const canEditStatus = (userRole === "OWNER" || userRole === "ADMIN" || session?.user?.id === projectLeader?.name) && !isArchived;
  const canEditSettings = userRole === "OWNER";
  const isViewer = userRole === "VIEWER";

  return (
    <div className="border-b bg-background">
      {isArchived && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium">
          <Archive className="h-4 w-4" />
          This project is archived and is in read-only mode.
        </div>
      )}
      {!isArchived && isViewer && (
        <div className="bg-muted/50 border-b border-border px-6 py-2 flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Eye className="h-3.5 w-3.5" />
          You have read-only access to this project.
        </div>
      )}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{projectName}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isFavorite ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
                    )}
                    onClick={() => toggleFavoriteMutation.mutate()}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2 h-7">
            {canEditStatus ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1 group">
                    <ProjectStatusBadge status={currentStatus} />
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem 
                        key={key} 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => updateStatusMutation.mutate(key)}
                      >
                        <Icon className={cn("h-4 w-4", config.iconColor)} />
                        <span>{config.label}</span>
                        {currentStatus === key && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <ProjectStatusBadge status={currentStatus} />
            )}
          </div>
        </div>
        {projectLeader && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project Lead:</span>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
              <Avatar className="h-6 w-6">
                {projectLeader.image && <AvatarImage src={projectLeader.image} />}
                <AvatarFallback>
                  {projectLeader.name?.[0] || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{projectLeader.name || "Unknown"}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Project Pulse Card */}
      {!isSettings && (
        <div className="px-6 pb-4">
          <div className={cn(
            "p-3 px-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-500",
            isHealthLoading ? "bg-slate-50/50 border-slate-100 animate-pulse" : "bg-indigo-50/40 border-indigo-100 shadow-sm"
          )}>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <Sparkles className={cn("h-4 w-4", isHealthLoading && "animate-spin")} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Project Pulse</span>
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  Health Report
                  {!isHealthLoading && healthData?.stats && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                      {Math.round((healthData.stats.done / healthData.stats.total) * 100) || 0}% Done
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1 text-indigo-400 hover:text-indigo-600 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshPulse();
                    }}
                    disabled={isHealthFetching}
                  >
                    <RefreshCw className={cn("h-3 w-3", isHealthFetching && "animate-spin")} />
                  </Button>
                </span>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-8 bg-indigo-100" />

            <div className="flex-1">
              {isHealthLoading ? (
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                  {healthData?.pulse}
                </p>
              )}
            </div>

            {!isHealthLoading && healthData?.stats && (
              <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-indigo-100 pt-3 md:pt-0 md:pl-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-indigo-500 uppercase font-bold">Overdue</span>
                  <span className={cn("text-sm font-bold", healthData.stats.overdue > 0 ? "text-red-500" : "text-slate-600")}>
                    {healthData.stats.overdue}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-indigo-500 uppercase font-bold">Priority</span>
                  <span className={cn("text-sm font-bold", healthData.stats.highPriority > 0 ? "text-amber-600" : "text-slate-600")}>
                    {healthData.stats.highPriority}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-indigo-500 uppercase font-bold">Blocked</span>
                  <span className={cn("text-sm font-bold", healthData.stats.delayed > 0 ? "text-orange-500" : "text-slate-600")}>
                    {healthData.stats.delayed}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-6 flex items-center gap-6">
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            isList ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List
          </div>
        </Link>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}/kanban`}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            isKanban ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Board
          </div>
        </Link>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}/timeline`}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            isTimeline ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <GanttChart className="h-4 w-4" />
            Timeline
          </div>
        </Link>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}/calendar`}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            isCalendar ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </div>
        </Link>
        {canEditSettings && (
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              isSettings ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </div>
          </Link>
        )}
        <div className="flex-1" />
        <div className="pb-3 flex items-center gap-2 pr-4">
          {!isSettings && !isViewer && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={() => setIsExtractionModalOpen(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  ✨ Extract multiple tasks from meeting notes or transcripts.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isSettings && <ProjectFilter />}
        </div>
      </div>

      <TaskExtractionModal 
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}
