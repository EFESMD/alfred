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
    return NextResponse.json(members.map(m => m.user));
  } catch (error: any) {
    console.error("[MEMBERS_GET] Error details:", error.message, error.stack);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
