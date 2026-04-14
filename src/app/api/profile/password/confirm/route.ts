import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hashToken } from "@/lib/utils";
import { sendPasswordChangedNotification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { otp, newPassword } = await req.json();

    if (!otp || !newPassword) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const hashedOtp = hashToken(otp);

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        changePasswordOTP: hashedOtp,
        changePasswordOTPExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return new NextResponse("Invalid or expired verification code", { status: 400 });
    }

    // 1. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 2. Update user and CLEAR OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        changePasswordOTP: null,
        changePasswordOTPExp: null,
        lastPasswordChange: new Date(),
      },
    });

    // 3. Send notification email
    await sendPasswordChangedNotification(user.email!);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("[PASSWORD_CHANGE_CONFIRM_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
