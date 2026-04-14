import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { hashToken } from "@/lib/utils";
import { validatePassword } from "@/lib/password-validator";
import { sendPasswordChangeOTP } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 1. Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return new NextResponse("Incorrect current password", { status: 400 });
    }

    // 2. Validate new password complexity
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return new NextResponse("New password does not meet requirements", { status: 400 });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashToken(otp);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        changePasswordOTP: hashedOtp,
        changePasswordOTPExp: expiry,
      },
    });

    // 5. Send Email
    await sendPasswordChangeOTP(user.email!, otp);

    return NextResponse.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("[PASSWORD_CHANGE_REQUEST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
