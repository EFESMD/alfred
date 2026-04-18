"use client";

import { CheckCircle2, AlertCircle, CheckCircle, PauseCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ProjectStatus = "ON_TRACK" | "DELAYED" | "COMPLETED" | "PARKED";

interface ProjectStatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
  showIcon?: boolean;
}

export const statusConfig = {
  ON_TRACK: {
    label: "On Track",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  DELAYED: {
    label: "Delayed",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle,
    iconColor: "text-blue-500",
  },
  PARKED: {
    label: "Parked",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    icon: PauseCircle,
    iconColor: "text-slate-500",
  },
};

export function ProjectStatusBadge({ status, className, showIcon = true }: ProjectStatusBadgeProps) {
  const config = statusConfig[status as ProjectStatus] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
    iconColor: "text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("px-2 py-0.5 font-medium flex items-center gap-1.5 whitespace-nowrap", config.color, className)}
    >
      {showIcon && <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />}
      {config.label}
    </Badge>
  );
}
