import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    // Secret key to prevent accidental triggers
    if (key !== "efes_admin_reset") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const targetEmail = "victor.nicolaescu@md.anadoluefes.com";

    // Mark the master admin as verified
    await prisma.user.update({
      where: { email: targetEmail },
      data: {
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Account ${targetEmail} has been manually verified. You can now login.` 
    });
  } catch (error) {
    console.error("[EMERGENCY_RESET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
