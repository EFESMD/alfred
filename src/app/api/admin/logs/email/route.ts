import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getEmailLogs } from "@/lib/logger";
import { checkIsAdmin } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const logs = getEmailLogs(50); // Get last 50 lines
    return new NextResponse(logs);
  } catch (error) {
    return new NextResponse("Failed to fetch logs", { status: 500 });
  }
}
