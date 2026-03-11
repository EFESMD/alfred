import { sendEmail } from "@/lib/mail";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await sendEmail({
      to: session.user.email,
      subject: "Alfred Mail Test",
      text: "This is a test email from Alfred to confirm your SMTP configuration is working.",
      html: "<h1>Alfred SMTP Test</h1><p>This is a test email from Alfred to confirm your SMTP configuration is working.</p>",
    });

    return NextResponse.json({ success: true, message: "Test email sent to " + session.user.email });
  } catch (error: any) {
    console.error("[TEST_MAIL_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
