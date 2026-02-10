import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { inviteCode } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: {
        inviteCode,
      },
    });

    if (!workspace) {
      return new NextResponse("Invalid invite code", { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ workspaceId: workspace.id });
    }

    // Create membership
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ workspaceId: workspace.id });
  } catch (error) {
    console.error("[JOIN_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
