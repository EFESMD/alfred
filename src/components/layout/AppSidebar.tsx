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
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

interface AppSidebarProps {
  workspace: {
    id: string;
    name: string;
  };
  projects: {
    id: string;
    name: string;
  }[];
}

export function AppSidebar({ workspace, projects }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <WorkspaceSwitcher currentWorkspace={workspace} />
      </SidebarHeader>
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
              <SidebarMenuButton asChild isActive={pathname.includes("/tasks")}>
                <Link href={`/workspaces/${workspace.id}/tasks`}>
                  <CheckSquare className="h-4 w-4" />
                  <span>My Tasks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes("/members")}>
                <Link href={`/workspaces/${workspace.id}/members`}>
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Projects</span>
            <Link href={`/workspaces/${workspace.id}/projects/create`} className="hover:bg-slate-200 p-1 rounded">
              <Plus className="h-3 w-3" />
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton asChild isActive={pathname.includes(`/projects/${project.id}`)}>
                    <Link href={`/workspaces/${workspace.id}/projects/${project.id}`}>
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      <span>{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {projects.length === 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground">
                  No projects yet
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
