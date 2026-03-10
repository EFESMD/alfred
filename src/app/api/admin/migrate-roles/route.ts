import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/utils";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Security check: Only the designated master admin can trigger migration
    if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log('🚀 Starting production project roles migration...');

    const projects = await prisma.project.findMany({
      include: {
        workspace: {
          include: {
            members: true,
          }
        }
      }
    });

    let processedCount = 0;
    let rolesCreated = 0;

    for (const project of projects) {
      const workspaceMembers = project.workspace.members;
      const workspaceOwnerId = project.workspace.ownerId;
      const projectLeaderId = project.projectLeaderId;

      for (const member of workspaceMembers) {
        let role = 'MEMBER';
        
        if (member.userId === workspaceOwnerId || member.userId === projectLeaderId) {
          role = 'OWNER';
        }

        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: member.userId,
            }
          },
          update: { role },
          create: {
            projectId: project.id,
            userId: member.userId,
            role,
          }
        });
        rolesCreated++;
      }
      processedCount++;
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      projectsProcessed: processedCount,
      rolesAssigned: rolesCreated
    });
  } catch (error) {
    console.error("[ADMIN_MIGRATE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
