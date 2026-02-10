"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  ChevronsUpDown, 
  Plus, 
  Building2 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspace: {
    id: string;
    name: string;
  };
}

export function WorkspaceSwitcher({ currentWorkspace }: WorkspaceSwitcherProps) {
  const router = useRouter();

  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return res.json();
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Workspace
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces?.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                {workspace.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/workspaces/create" className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add workspace</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
