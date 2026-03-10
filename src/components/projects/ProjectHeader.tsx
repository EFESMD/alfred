"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, LayoutGrid, Calendar as CalendarIcon, GanttChart, User, Settings, Archive, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectHeaderProps {
  workspaceId: string;
  projectId: string;
  projectName: string;
  projectLeader?: {
    name: string | null;
    image: string | null;
  } | null;
  isArchived?: boolean;
  userRole?: string;
}

export function ProjectHeader({ 
  workspaceId, 
  projectId, 
  projectName, 
  projectLeader,
  isArchived = false,
  userRole = "MEMBER"
}: ProjectHeaderProps) {
  const pathname = usePathname();

  const isKanban = pathname.endsWith("/kanban");
  const isCalendar = pathname.endsWith("/calendar");
  const isTimeline = pathname.endsWith("/timeline");
  const isSettings = pathname.endsWith("/settings");
  const isList = !isKanban && !isCalendar && !isTimeline && !isSettings;

  const canEditSettings = userRole === "OWNER";
  const isViewer = userRole === "VIEWER";

  return (
    <div className="border-b bg-white">
      {isArchived && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium">
          <Archive className="h-4 w-4" />
          This project is archived and is in read-only mode.
        </div>
      )}
      {!isArchived && isViewer && (
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-2 flex items-center gap-2 text-slate-600 text-xs font-medium">
          <Eye className="h-3.5 w-3.5" />
          You have read-only access to this project.
        </div>
      )}
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{projectName}</h1>
        {projectLeader && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project Lead:</span>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
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
      </div>
    </div>
  );
}
