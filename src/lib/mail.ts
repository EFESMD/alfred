import nodemailer from "nodemailer";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "587");
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for port 465
  auth: {
    user,
    pass,
  },
  // Efes server might need specific settings for older SSL/TLS or self-signed certs
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!user || !pass) {
    console.warn("[MAIL] Skipping email send: No credentials configured.");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: from || user,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log("[MAIL] Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("[MAIL] Error sending email:", error);
    throw error;
  }
}
