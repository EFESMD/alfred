import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.formData();
    const socketId = body.get("socket_id") as string;
    const channelName = body.get("channel_name") as string;

    // Verify user is authorized for this channel
    // Private user channels are formatted as private-user-${userId}
    if (channelName === `private-user-${session.user.id}`) {
      const authResponse = pusherServer?.authorizeChannel(socketId, channelName);
      return NextResponse.json(authResponse);
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
