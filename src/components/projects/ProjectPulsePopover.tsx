"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HealthStats {
  total: number;
  done: number;
  overdue: number;
  inProgress: number;
  delayed: number;
  highPriority: number;
}

interface HealthData {
  pulse: string;
  stats: HealthStats;
  cachedAt?: string;
}

interface ProjectPulsePopoverProps {
  workspaceId: string;
  projectId: string;
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-[10px] text-indigo-500 uppercase font-bold">{label}</span>
      <span className={cn("text-sm font-bold", value > 0 ? highlight : "text-slate-600")}>
        {value}
      </span>
    </div>
  );
}

export function ProjectPulsePopover({ workspaceId, projectId }: ProjectPulsePopoverProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<HealthData>({
    queryKey: ["project-health", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/ai-health`);
      if (!res.ok) throw new Error("Failed to fetch health pulse");
      return res.json();
    },
    // Only reach for the report once someone actually opens the popover.
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/ai-health?refresh=true`
      );
      if (!res.ok) throw new Error("Failed to refresh health pulse");
      queryClient.setQueryData(["project-health", projectId], await res.json());
    } catch {
      toast.error("Couldn't refresh the pulse");
    } finally {
      setIsRefreshing(false);
    }
  };

  const percentDone = data?.stats
    ? Math.round((data.stats.done / data.stats.total) * 100) || 0
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold">Pulse</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
            <Sparkles className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              Project Pulse
            </span>
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              Health Report
              {percentDone !== null && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                  {percentDone}% Done
                </span>
              )}
            </span>
          </div>
        </div>

        <Separator className="bg-indigo-100" />

        <div className="px-4 py-3">
          {isLoading || isRefreshing ? (
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                Couldn&apos;t load the health report.
              </p>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <p className="text-sm text-indigo-900 leading-relaxed font-medium">{data?.pulse}</p>
          )}
        </div>

        {!isError && data?.stats && (
          <>
            <Separator className="bg-indigo-100" />
            <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50/40">
              <Stat label="Overdue" value={data.stats.overdue} highlight="text-red-500" />
              <Stat label="Priority" value={data.stats.highPriority} highlight="text-amber-600" />
              <Stat label="Blocked" value={data.stats.delayed} highlight="text-orange-500" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Regenerate report"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
