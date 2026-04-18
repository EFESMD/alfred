import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      workspaceId: workspaceId,
    },
    include: {
      projectLeader: {
        select: {
          name: true,
          image: true,
        },
      },
      workspace: {
        select: {
          ownerId: true
        }
      },
      members: {
        where: { userId: session.user.id },
        select: { role: true, isFavorite: true }
      }
    },
  });

  if (!project) {
    redirect(`/workspaces/${workspaceId}`);
  }

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  const isWorkspaceAdminOrOwner = 
    workspaceMember?.role === "OWNER" || 
    workspaceMember?.role === "ADMIN" || 
    project.workspace.ownerId === session.user.id;

  const projectMember = project.members[0];
  
  // Forbidden if not workspace admin/owner and not a member of the project
  if (!isWorkspaceAdminOrOwner && !projectMember) {
    redirect(`/workspaces/${workspaceId}`);
  }

  const userRole = isWorkspaceAdminOrOwner ? "OWNER" : projectMember.role;
  const isFavorite = projectMember?.isFavorite || false;

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader 
        workspaceId={workspaceId} 
        projectId={projectId} 
        projectName={project.name} 
        projectLeader={project.projectLeader}
        status={project.status}
        isArchived={project.isArchived}
        userRole={userRole}
        initialIsFavorite={isFavorite}
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
