import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Security check: Only the designated master admin can access
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [users, workspaces, projects, tasks] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          _count: {
            select: { memberships: true }
          }
        }
      }),
      prisma.workspace.count(),
      prisma.project.count(),
      prisma.task.count(),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        totalWorkspaces: workspaces,
        totalProjects: projects,
        totalTasks: tasks,
      },
      users,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Endpoint to manually verify a user
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
