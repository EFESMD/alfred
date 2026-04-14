import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { hashToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Security: Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(resetToken);
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExp: expiry,
      },
    });

    // Send email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email || "")}`;

    await sendPasswordResetEmail(user.email!, resetUrl);

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
