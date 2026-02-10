"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  workspaceId: string;
  projectId: string;
  projectName: string;
}

export function ProjectHeader({ workspaceId, projectId, projectName }: ProjectHeaderProps) {
  const pathname = usePathname();

  const isKanban = pathname.endsWith("/kanban");
  const isCalendar = pathname.endsWith("/calendar");
  const isList = !isKanban && !isCalendar;

  return (
    <div className="border-b bg-white">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{projectName}</h1>
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
      </div>
    </div>
  );
}
