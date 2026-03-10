import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET: List all members of a project
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string, projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await params;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[PROJECT_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Add a member to a project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string, projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { workspaceId, projectId } = await params;
    const { userId, role = "MEMBER" } = await req.json();

    if (!userId) return new NextResponse("User ID is required", { status: 400 });

    // 1. Verify requester is Workspace Owner or Project Owner
    const [workspace, projectMember] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } }),
      prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
        select: { role: true }
      })
    ]);

    const isAuthorized = workspace?.ownerId === session.user.id || projectMember?.role === "OWNER";
    if (!isAuthorized) return new NextResponse("Forbidden", { status: 403 });

    // 2. Verify target user is a member of the workspace
    const isWorkspaceMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!isWorkspaceMember) {
      return new NextResponse("User must be a member of the workspace first", { status: 400 });
    }

    // 3. Add to project
    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role
      },
      include: {
        user: true
      }
    });

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("[PROJECT_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
