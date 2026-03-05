import { TaskListView } from "@/components/tasks/TaskListView";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      workspaceId: workspaceId,
    },
    select: {
      isArchived: true,
      projectLeaderId: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <TaskListView 
      workspaceId={workspaceId} 
      projectId={projectId} 
      isArchived={project.isArchived} 
      projectLeaderId={project.projectLeaderId}
    />
  );
}
