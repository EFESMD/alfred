import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      projects: {
        where: {
          isTemplate: false,
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
          <header className="h-14 border-b flex items-center px-4 bg-[#efefef] shrink-0">
            <SidebarTrigger />
            <div className="ml-4 font-medium">{workspace.name}</div>
          </header>
          <div className="flex-1 overflow-auto bg-slate-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
