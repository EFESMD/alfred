import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        memberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
