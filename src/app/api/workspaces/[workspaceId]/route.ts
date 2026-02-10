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
    console.log("API: Fetching workspace", workspaceId, "for user", session.user.id);

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!workspace) {
      console.log("API: Workspace not found or user is not a member");
      return new NextResponse("Not Found", { status: 404 });
    }

    console.log("API: Workspace found", workspace.name);

    // Ensure invite code exists (for old records)
    if (!workspace.inviteCode) {
      console.log("API: Generating missing invite code");
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { inviteCode: `inv_${Math.random().toString(36).substring(2, 9)}` },
      });
      return NextResponse.json(updatedWorkspace);
    }

    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error("[WORKSPACE_GET] Error details:", error.message, error.stack);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
