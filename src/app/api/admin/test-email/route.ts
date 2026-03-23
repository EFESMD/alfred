import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import { checkIsAdmin } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { targetEmail } = await req.json();

    if (!targetEmail) {
      return new NextResponse("Target email is required", { status: 400 });
    }

    await sendEmail({
      to: targetEmail,
      subject: "Test Email from Alfred Admin Panel",
      text: `This is a test email sent from the Alfred Admin Dashboard.\n\nTime: ${new Date().toLocaleString()}\nSent by: ${session.user.email}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TEST_EMAIL]", error);
    return new NextResponse(error.message || "Failed to send email", { status: 500 });
  }
}
