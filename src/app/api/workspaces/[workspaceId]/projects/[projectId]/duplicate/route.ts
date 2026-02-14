import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { workspaceId, projectId } = await params;
    const { name, isTemplate } = await req.json();

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch source project with all tasks and sections
    const sourceProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sourceProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Create the new project
    const newProject = await prisma.project.create({
      data: {
        name: name || `${sourceProject.name} (Copy)`,
        description: sourceProject.description,
        color: sourceProject.color,
        icon: sourceProject.icon,
        workspaceId: sourceProject.workspaceId,
        projectLeaderId: session.user.id, // Current user becomes leader of the copy
        isTemplate: isTemplate ?? false,
      },
    });

    // 1. Clone Sections and keep a map of { oldSectionId: newSectionId }
    const sectionIdMap: Record<string, string> = {};
    for (const section of sourceProject.sections) {
      const clonedSection = await prisma.section.create({
        data: {
          name: section.name,
          order: section.order,
          projectId: newProject.id,
        },
      });
      sectionIdMap[section.id] = clonedSection.id;
    }

    // CLONING ENGINE: Maintain hierarchy
    // 2. Separate top-level tasks and subtasks
    const topLevelTasks = sourceProject.tasks.filter(t => !t.parentId);
    const subtasks = sourceProject.tasks.filter(t => t.parentId);

    // 3. Clone top-level tasks and keep a map of { oldTaskId: newTaskId }
    const taskIdMap: Record<string, string> = {};

    for (const task of topLevelTasks) {
      const clonedTask = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          startDate: null, // Clean dates for new projects
          dueDate: null,   // Clean dates for new projects
          projectId: newProject.id,
          sectionId: task.sectionId ? sectionIdMap[task.sectionId] : null,
          assigneeId: null, // Keep it clean for new projects
        },
      });
      taskIdMap[task.id] = clonedTask.id;
    }

    // 4. Clone subtasks using the map to link to new parents
    for (const task of subtasks) {
      if (task.parentId && taskIdMap[task.parentId]) {
        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            startDate: null, // Clean dates
            dueDate: null,   // Clean dates
            projectId: newProject.id,
            sectionId: task.sectionId ? sectionIdMap[task.sectionId] : null,
            parentId: taskIdMap[task.parentId],
            assigneeId: null,
          },
        });
      }
    }

    return NextResponse.json(newProject);
  } catch (error) {
    console.error("[PROJECT_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
