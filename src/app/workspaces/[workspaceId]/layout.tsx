import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  // 1. Get user's membership in the workspace to check role
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const isAdminOrOwner = membership.role === "OWNER" || membership.role === "ADMIN";

  // 2. Fetch workspace and projects with correct visibility filtering
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      projects: {
        where: {
          isTemplate: false,
          // Filter: Admin/Owner sees all, others only where they are members
          ...(isAdminOrOwner ? {} : {
            members: {
              some: {
                userId: session.user.id
              }
            }
          })
        },
        select: {
          id: true,
          name: true,
          isArchived: true,
          color: true,
          icon: true,
        },
      },
    },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar workspace={workspace} projects={workspace.projects} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4 font-medium">{workspace.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-muted/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
