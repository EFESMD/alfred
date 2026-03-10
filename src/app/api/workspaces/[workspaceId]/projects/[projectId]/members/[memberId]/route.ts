import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// PATCH: Update member role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string, projectId: string, memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { workspaceId, projectId, memberId } = await params;
    const { role } = await req.json();

    if (!role) return new NextResponse("Role is required", { status: 400 });

    // Verify requester is Workspace Owner or Project Owner
    const [workspace, projectMember] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } }),
      prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
        select: { role: true }
      })
    ]);

    const isAuthorized = workspace?.ownerId === session.user.id || projectMember?.role === "OWNER";
    if (!isAuthorized) return new NextResponse("Forbidden", { status: 403 });

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("[PROJECT_MEMBER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE: Remove member from project
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string, projectId: string, memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { workspaceId, projectId, memberId } = await params;

    // Verify requester is Workspace Owner or Project Owner
    const [workspace, projectMember] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } }),
      prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
        select: { role: true }
      })
    ]);

    const isAuthorized = workspace?.ownerId === session.user.id || projectMember?.role === "OWNER";
    if (!isAuthorized) return new NextResponse("Forbidden", { status: 403 });

    // Prevent removing the last owner if needed (optional but recommended)
    const memberToDelete = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (memberToDelete?.role === "OWNER") {
        const ownerCount = await prisma.projectMember.count({
            where: { projectId, role: "OWNER" }
        });
        if (ownerCount <= 1) {
            return new NextResponse("Cannot remove the last project owner", { status: 400 });
        }
    }

    await prisma.projectMember.delete({
      where: { id: memberId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_MEMBER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
