"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  Plus, 
  LogOut,
  FolderOpen,
  Users,
  Archive,
  ShieldCheck,
  User,
  Star,
  Layout
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  workspace: {
    id: string;
    name: string;
  };
  projects: {
    id: string;
    name: string;
    isArchived: boolean;
    color: string | null;
    icon: string | null;
  }[];
}

export function AppSidebar({ workspace, projects }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const activeProjects = projects.filter(p => !p.isArchived);

  // Fetch the current user's role from the queryClient or a new query
  // For simplicity, we can also pass the user role as a prop, but let's check membership
  const { data: members } = useQuery({
    queryKey: ["members", workspace.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`);
      return res.json();
    },
  });

  const currentUserMembership = members?.find((m: any) => m.user.id === session?.user?.id);
  const isAdminOrOwner = currentUserMembership?.role === "OWNER" || currentUserMembership?.role === "ADMIN";

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/projects/favorites");
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <WorkspaceSwitcher currentWorkspace={workspace} />
      </SidebarHeader>
      <TooltipProvider delayDuration={0}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === `/workspaces/${workspace.id}`}>
                  <Link href={`/workspaces/${workspace.id}`}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes("/tasks") && !pathname.includes("/all-tasks")}>
                  <Link href={`/workspaces/${workspace.id}/tasks`}>
                    <CheckSquare className="h-4 w-4" />
                    <span>My Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes("/all-tasks")}>
                  <Link href={`/workspaces/${workspace.id}/all-tasks`}>
                    <Layout className="h-4 w-4" />
                    <span>All My Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdminOrOwner && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes("/settings")}>
                    <Link href={`/workspaces/${workspace.id}/settings`}>
                      <Settings className="h-4 w-4" />
                      <span>Workspace Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>

          {favorites && favorites.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>Favorites</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {favorites.map((project: any) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild isActive={pathname.includes(`/projects/${project.id}`)}>
                        <Link href={`/workspaces/${project.workspaceId}/projects/${project.id}`}>
                          <div 
                            className={cn(
                              "w-4 h-4 rounded-sm flex items-center justify-center text-[10px] shadow-xs border",
                              project.color || "bg-primary text-white"
                            )}
                          >
                            {project.icon || <FolderOpen className="h-3 w-3" />}
                          </div>
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Projects</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    href={`/workspaces/${workspace.id}/projects/create`} 
                    className="hover:bg-green-100 p-1 rounded-md border border-green-200 bg-green-50 transition-colors group/add"
                  >
                    <Plus className="h-3 w-3 text-black transition-colors" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Create new project
                </TooltipContent>
              </Tooltip>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild isActive={pathname.includes(`/projects/${project.id}`)}>
                      <Link href={`/workspaces/${workspace.id}/projects/${project.id}`}>
                        <div 
                          className={cn(
                            "w-4 h-4 rounded-sm flex items-center justify-center text-[10px] shadow-xs border",
                            project.color || "bg-primary text-white"
                          )}
                        >
                          {project.icon || <FolderOpen className="h-3 w-3" />}
                        </div>
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {activeProjects.length === 0 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    No active projects
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </TooltipProvider>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full justify-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate">{session?.user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{session?.user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                {session?.user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-medium">System Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
