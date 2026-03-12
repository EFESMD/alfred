"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Check, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TaskFilterType } from "@/hooks/use-task-filter";
import { cn } from "@/lib/utils";

export function ProjectFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilter = (searchParams.get("filter") as TaskFilterType) || "incomplete";

  const setFilter = (filter: TaskFilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "incomplete") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getLabel = () => {
    switch (currentFilter) {
      case "incomplete":
        return "Incomplete tasks";
      case "completed":
        return "Completed tasks";
      case "all":
        return "All tasks";
      default:
        return "Incomplete tasks";
    }
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">{getLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem 
            onClick={() => setFilter("incomplete")}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span>Incomplete tasks</span>
            </div>
            {currentFilter === "incomplete" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setFilter("completed")}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Completed tasks</span>
            </div>
            {currentFilter === "completed" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setFilter("all")}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-500" />
              <span>All tasks</span>
            </div>
            {currentFilter === "all" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
