import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check for allowed company domain
    const allowedDomain = "md.anadoluefes.com";
    if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      return new NextResponse(`Only ${allowedDomain} email addresses are allowed for registration.`, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        password: hashedPassword,
      },
    });

    // Generate Verification Token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send Verification Email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: "Oxana - Verificarea contului tău",
      text: `Salut ${firstName},\n\nBine ai venit în Oxana! Te rugăm să îți confirmi adresa de email accesând acest link: ${verificationUrl}\n\nAcest link va expira în 24 de ore.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Salut ${firstName},</h1>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Bine ai venit în platforma de project management <strong>Oxana</strong>!</p>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Pentru a activa contul tău și a începe colaborarea cu echipa, te rugăm să confirmi adresa de email făcând clic pe butonul de mai jos:</p>
          <div style="margin: 32px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Confirmă Email</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Sau copiază acest link în browser:</p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Acest link va expira în 24 de ore. Dacă nu tu ai creat acest cont, te rugăm să ignori acest mesaj.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Echipa Oxana</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      message: "User created. Verification email sent.",
      userId: user.id 
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
