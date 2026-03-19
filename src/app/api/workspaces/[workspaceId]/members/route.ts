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

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { workspaceId } = await params;
    console.log("API: Fetching members for workspace", workspaceId);

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    console.log(`API: Found ${members.length} members`);
    return NextResponse.json(members);
  } catch (error: any) {
    console.error("[MEMBERS_GET] Error details:", error.message, error.stack);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { workspaceId } = await params;
    const { userId, role } = await req.json();

    // 1. Fetch workspace to identify owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true }
    });

    if (!workspace) return new NextResponse("Workspace not found", { status: 404 });

    // 2. Prevent changing the role of the workspace owner
    if (userId === workspace.ownerId) {
      return new NextResponse("Cannot change the role of the workspace owner", { status: 400 });
    }

    // 3. Verify requester is OWNER or ADMIN
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id }
      }
    });

    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[MEMBERS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { workspaceId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return new NextResponse("User ID required", { status: 400 });

    // Verify current user is OWNER or ADMIN
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id }
      }
    });

    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Don't allow removing the owner (must delete workspace or transfer)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true }
    });

    if (userId === workspace?.ownerId) {
      return new NextResponse("The owner cannot be removed from the workspace", { status: 400 });
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MEMBERS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
