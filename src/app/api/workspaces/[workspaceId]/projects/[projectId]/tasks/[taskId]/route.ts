import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { deletePhysicalTaskAttachments } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        predecessors: {
          select: {
            id: true,
            title: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("[TASK_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { taskId, projectId } = await params;
    const body = await req.json();
    const { status, priority, title, description, assigneeId, startDate, dueDate, predecessorIds, sectionId } = body;

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, predecessors: true, section: true }
    });

    if (!currentTask) {
      return new NextResponse("Task not found", { status: 404 });
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
        projectId: projectId,
      },
      data: {
        status,
        priority,
        title,
        description,
        assigneeId,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        sectionId: sectionId === "uncategorized" ? null : sectionId,
        predecessors: predecessorIds ? {
          set: predecessorIds.map((id: string) => ({ id }))
        } : undefined,
      },
    });

    const activities = [];
    
    if (sectionId !== undefined && sectionId !== currentTask.sectionId) {
      const newSection = sectionId && sectionId !== "uncategorized"
        ? await prisma.section.findUnique({ where: { id: sectionId } })
        : null;
      
      activities.push({
        type: "SECTION_CHANGED",
        description: newSection 
          ? `moved task to section "${newSection.name}"` 
          : "moved task to Uncategorized",
        taskId,
        userId: session.user.id,
      });
    }
    if (status && status !== currentTask.status) {
      activities.push({
        type: "STATUS_CHANGED",
        description: `changed status from ${currentTask.status} to ${status}`,
        taskId,
        userId: session.user.id,
      });
    }
    if (predecessorIds) {
      activities.push({
        type: "DEPENDENCIES_CHANGED",
        description: "updated task dependencies",
        taskId,
        userId: session.user.id,
      });
    }
    if (priority && priority !== currentTask.priority) {
      activities.push({
        type: "PRIORITY_CHANGED",
        description: `changed priority from ${currentTask.priority} to ${priority}`,
        taskId,
        userId: session.user.id,
      });
    }
    if (title && title !== currentTask.title) {
      activities.push({
        type: "TITLE_CHANGED",
        description: `renamed task to "${title}"`,
        taskId,
        userId: session.user.id,
      });
    }
    if (startDate && new Date(startDate).getTime() !== currentTask.startDate?.getTime()) {
      activities.push({
        type: "START_DATE_CHANGED",
        description: `changed start date to ${format(new Date(startDate), "PPP")}`,
        taskId,
        userId: session.user.id,
      });
    }
    if (dueDate && new Date(dueDate).getTime() !== currentTask.dueDate?.getTime()) {
      activities.push({
        type: "DUE_DATE_CHANGED",
        description: `changed due date to ${format(new Date(dueDate), "PPP")}`,
        taskId,
        userId: session.user.id,
      });
    }
    if (assigneeId !== undefined && assigneeId !== currentTask.assigneeId) {
      const newAssignee = assigneeId 
        ? await prisma.user.findUnique({ where: { id: assigneeId } }) 
        : null;
      activities.push({
        type: "ASSIGNEE_CHANGED",
        description: newAssignee 
          ? `assigned task to ${newAssignee.name}` 
          : "unassigned the task",
        taskId,
        userId: session.user.id,
      });

      if (assigneeId && assigneeId !== session.user.id) {
        const { createNotification } = await import("@/lib/notifications");
        const { workspaceId } = await params;
        await createNotification({
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `${session.user.name} assigned you a task: ${task.title}`,
          link: `/workspaces/${workspaceId}/projects/${projectId}?taskId=${task.id}`,
        });
      }
    }

    if (activities.length > 0) {
      await prisma.activity.createMany({
        data: activities,
      });
    }

    if (pusherServer) {
      await pusherServer.trigger(`project-${projectId}`, "task-updated", task);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { taskId, projectId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }

    try {
      await deletePhysicalTaskAttachments(taskId);
    } catch (storageError) {
      console.error("[TASK_DELETE] Storage deletion warning:", storageError);
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          predecessors: { set: [] },
          successors: { set: [] }
        }
      });

      await tx.task.deleteMany({
        where: { parentId: taskId }
      });

      await tx.comment.deleteMany({ where: { taskId } });
      await tx.activity.deleteMany({ where: { taskId } });
      await tx.attachment.deleteMany({ where: { taskId } });

      await tx.task.delete({
        where: { id: taskId }
      });
    });

    if (pusherServer) {
      await pusherServer.trigger(`project-${projectId}`, "task-deleted", { id: taskId });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
