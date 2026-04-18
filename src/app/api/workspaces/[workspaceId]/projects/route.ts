import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { workspaceId } = await params;
    const { searchParams } = new URL(req.url);
    const isTemplate = searchParams.get("isTemplate") === "true";

    // Check if user is Workspace Owner or Admin
    const workspaceMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    const isWorkspaceAdminOrOwner = workspaceMembership?.role === "OWNER" || workspaceMembership?.role === "ADMIN";

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        isTemplate,
        // Filter: Workspace Owner/Admin sees all, others only where they are members
        ...(isWorkspaceAdminOrOwner ? {} : {
          members: {
            some: {
              userId: session.user.id
            }
          }
        })
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { role: true }
        }
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, projectLeaderId, status } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const { workspaceId } = await params;

    // Verify workspace membership
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

    // Create project and automatically add the creator as OWNER
    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
        projectLeaderId,
        status: status || "ON_TRACK",
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          }
        }
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
