import { CalendarView } from "@/components/calendar/CalendarView";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CalendarPage({
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
    },
  });

  if (!project) {
    notFound();
  }

  return <CalendarView workspaceId={workspaceId} projectId={projectId} isArchived={project.isArchived} />;
}
