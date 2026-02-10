import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectHeader } from "@/components/projects/ProjectHeader";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      workspaceId: workspaceId,
    },
    select: {
      name: true,
    },
  });

  if (!project) {
    redirect(`/workspaces/${workspaceId}`);
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader 
        workspaceId={workspaceId} 
        projectId={projectId} 
        projectName={project.name} 
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
